// Berrova checkout Worker -- Cloudflare dashboard single-file version.
//
// Turns a validated cart (or a single subscribe item) into a Stripe Checkout
// Session and returns the redirect URL. Talks to Stripe via fetch + form
// encoding, so there is no npm SDK and no dashboard Products to maintain.
//
// The server-side PRICE_MAP below is the authority at charge time. The client
// sends only { id, qty, mode }. Any price a client tries to send is ignored.
//
// Set these two variables in the Worker's Settings -> Variables and Secrets:
//   STRIPE_SECRET_KEY  (type: Secret)  your sk_test_... now, sk_live_... later
//   SITE_ORIGIN        (type: Text)    https://berrova.com   (no trailing slash)

const CURRENCY = "usd";
const PRICE_MAP = {
  "shr-8oz": { name: "Strawberry Hill Reserve 8 oz", oneTimeCents: 6800, subscribeCents: 5900 },
  "shr-16oz": { name: "Strawberry Hill Reserve 16 oz", oneTimeCents: 12500, subscribeCents: 10900 },
  "shr-giftbox": { name: "Reserve Gift Box (3 x 2 oz)", oneTimeCents: 7900, subscribeCents: null },
  "shr-sample": { name: "Strawberry Hill Reserve 2 oz sample", oneTimeCents: 1400, subscribeCents: null },
};

const SHIP_COUNTRIES = ["US", "CA"];
const MAX_ITEMS = 50;
const MAX_QTY = 99;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function parseItems(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) {
    return { error: "Body must be { items: [...] }." };
  }
  const rawItems = raw.items;
  if (rawItems.length === 0) return { error: "Cart is empty." };
  if (rawItems.length > MAX_ITEMS) return { error: "Too many items." };

  const items = [];
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") return { error: "Malformed item." };
    const id = entry.id;
    const qty = entry.qty;
    const mode = entry.mode;
    if (typeof id !== "string" || !(id in PRICE_MAP)) {
      return { error: `Unknown item: ${String(id)}` };
    }
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return { error: "Quantity out of range." };
    }
    if (mode !== "payment" && mode !== "subscription") {
      return { error: "Invalid mode." };
    }
    items.push({ id, qty, mode });
  }

  const wantsSub = items.some((i) => i.mode === "subscription");
  if (wantsSub) {
    if (items.length !== 1 || items[0].mode !== "subscription") {
      return { error: "A subscription must be a single subscribe item." };
    }
    if (PRICE_MAP[items[0].id].subscribeCents === null) {
      return { error: "That item is not available as a subscription." };
    }
    return { items, mode: "subscription" };
  }
  return { items, mode: "payment" };
}

function buildForm(items, mode, origin) {
  const form = new URLSearchParams();
  form.set("mode", mode);

  items.forEach((item, i) => {
    const product = PRICE_MAP[item.id];
    const unit = mode === "subscription" ? product.subscribeCents : product.oneTimeCents;
    const p = `line_items[${i}]`;
    form.set(`${p}[quantity]`, String(item.qty));
    form.set(`${p}[price_data][currency]`, CURRENCY);
    form.set(`${p}[price_data][unit_amount]`, String(unit));
    form.set(`${p}[price_data][product_data][name]`, product.name);
    if (mode === "subscription") {
      form.set(`${p}[price_data][recurring][interval]`, "month");
    }
  });

  SHIP_COUNTRIES.forEach((c, i) => {
    form.set(`shipping_address_collection[allowed_countries][${i}]`, c);
  });

  // Not setting payment_method_types on purpose: the methods you enable in the
  // Stripe dashboard (cards, Affirm, Afterpay) apply automatically.
  form.set("success_url", `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/order/cancelled`);

  return form;
}

export default {
  async fetch(request, env) {
    const allowedOrigin = (env.SITE_ORIGIN || "https://berrova.com").replace(/\/$/, "");
    const cors = corsHeaders(allowedOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/create-checkout-session") {
      return json({ error: "Not found." }, 404, cors);
    }

    const reqOrigin = request.headers.get("Origin");
    if (reqOrigin && reqOrigin.replace(/\/$/, "") !== allowedOrigin) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    if (!env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set");
      return json({ error: "Checkout is not configured." }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400, cors);
    }

    const parsed = parseItems(body);
    if ("error" in parsed) {
      return json({ error: parsed.error }, 400, cors);
    }

    const form = buildForm(parsed.items, parsed.mode, allowedOrigin);

    let stripeRes;
    try {
      stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
    } catch {
      return json({ error: "Could not reach payment processor." }, 502, cors);
    }

    if (!stripeRes.ok) {
      const detail = await stripeRes.text();
      console.error("Stripe error", stripeRes.status, detail);
      return json({ error: "Could not start checkout." }, 502, cors);
    }

    const session = await stripeRes.json();
    if (!session.url) {
      return json({ error: "Could not start checkout." }, 502, cors);
    }

    return json({ url: session.url }, 200, cors);
  },
};
