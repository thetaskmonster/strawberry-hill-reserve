// Berrova checkout Worker.
//
// One job: turn a validated cart (or a single subscribe item) into a Stripe
// Checkout Session and hand back the redirect URL. It talks to Stripe over the
// REST API with fetch and form-encoding, so there is no Stripe npm SDK and no
// dashboard Products to maintain (line items are built inline via price_data).
//
// Trust boundary: the server-side PRICE_MAP below is the authority at charge
// time. The client sends only { id, qty, mode }. Any price a client tries to
// send is ignored. Unknown ids are rejected.
//
// House style: no em dashes.

export interface Env {
  // Set with: wrangler secret put STRIPE_SECRET_KEY
  STRIPE_SECRET_KEY: string;
  // The site origin allowed by CORS and used to build return URLs.
  // e.g. https://berrova.com  (configurable per environment)
  SITE_ORIGIN: string;
}

type Mode = "payment" | "subscription";

type Product = {
  name: string;
  oneTimeCents: number;
  subscribeCents: number | null;
};

// MIRROR of src/content/store.ts. Kept in sync by hand; this copy is the
// authority. If you change a price, change it in BOTH files.
const CURRENCY = "usd";
const PRICE_MAP: Record<string, Product> = {
  "shr-8oz": { name: "Strawberry Hill Reserve 8 oz", oneTimeCents: 6800, subscribeCents: 5900 },
  "shr-16oz": { name: "Strawberry Hill Reserve 16 oz", oneTimeCents: 12500, subscribeCents: 10900 },
  "shr-giftbox": { name: "Reserve Gift Box (3 x 2 oz)", oneTimeCents: 7900, subscribeCents: null },
  "shr-sample": { name: "Strawberry Hill Reserve 2 oz sample", oneTimeCents: 1400, subscribeCents: null },
};

const SHIP_COUNTRIES = ["US", "CA"];
const MAX_ITEMS = 50;
const MAX_QTY = 99;

type IncomingItem = { id: string; qty: number; mode: Mode };

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

// Narrow and validate the request body. Returns either a clean item list plus
// the uniform session mode, or an error string.
function parseItems(raw: unknown): { items: IncomingItem[]; mode: Mode } | { error: string } {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { items?: unknown }).items)) {
    return { error: "Body must be { items: [...] }." };
  }
  const rawItems = (raw as { items: unknown[] }).items;
  if (rawItems.length === 0) return { error: "Cart is empty." };
  if (rawItems.length > MAX_ITEMS) return { error: "Too many items." };

  const items: IncomingItem[] = [];
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") return { error: "Malformed item." };
    const id = (entry as IncomingItem).id;
    const qty = (entry as IncomingItem).qty;
    const mode = (entry as IncomingItem).mode;
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
    // Stripe will not mix one-time and recurring in one session, so a
    // subscription session is exactly one subscribable item.
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

// Build the application/x-www-form-urlencoded body Stripe expects, including the
// nested line_items and price_data. Amounts come from PRICE_MAP only.
function buildForm(items: IncomingItem[], mode: Mode, origin: string): URLSearchParams {
  const form = new URLSearchParams();
  form.set("mode", mode);

  items.forEach((item, i) => {
    const product = PRICE_MAP[item.id];
    const unit = mode === "subscription" ? product.subscribeCents! : product.oneTimeCents;
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

  // Intentionally NOT setting payment_method_types: let the dashboard-enabled
  // methods (cards, Affirm, Afterpay, etc.) apply automatically.
  form.set("success_url", `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/order/cancelled`);

  return form;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = (env.SITE_ORIGIN || "https://berrova.com").replace(/\/$/, "");
    const cors = corsHeaders(allowedOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/create-checkout-session") {
      return json({ error: "Not found." }, 404, cors);
    }

    // Only accept posts from the configured site origin.
    const reqOrigin = request.headers.get("Origin");
    if (reqOrigin && reqOrigin.replace(/\/$/, "") !== allowedOrigin) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    if (!env.STRIPE_SECRET_KEY) {
      // Never echo the key or its absence in a way that leaks config to clients.
      console.error("STRIPE_SECRET_KEY is not set");
      return json({ error: "Checkout is not configured." }, 500, cors);
    }

    let body: unknown;
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

    let stripeRes: Response;
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
      // Log server-side for debugging; return a generic client message. Never
      // include the secret key. Stripe error bodies do not contain it.
      const detail = await stripeRes.text();
      console.error("Stripe error", stripeRes.status, detail);
      return json({ error: "Could not start checkout." }, 502, cors);
    }

    const session = (await stripeRes.json()) as { url?: string };
    if (!session.url) {
      return json({ error: "Could not start checkout." }, 502, cors);
    }

    return json({ url: session.url }, 200, cors);
  },
};
