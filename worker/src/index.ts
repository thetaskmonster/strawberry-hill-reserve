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
  // Shared-secret guard token. Set with: wrangler secret put CHECKOUT_GUARD_TOKEN
  // Required on every POST via the X-Berrova-Guard header. See the comment on
  // guardTokenValid() below for what this does and does not protect against.
  CHECKOUT_GUARD_TOKEN: string;
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
    // X-Berrova-Guard carries the shared guard token (see guardTokenValid).
    // It has to be listed here or the browser's real POST never leaves the
    // preflight stage.
    "Access-Control-Allow-Headers": "Content-Type, X-Berrova-Guard",
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
export function parseItems(raw: unknown): { items: IncomingItem[]; mode: Mode } | { error: string } {
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
export function buildForm(items: IncomingItem[], mode: Mode, origin: string): URLSearchParams {
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

// Constant-time byte compare for secret strings. Workers' crypto.subtle does
// not expose a timingSafeEqual, and Node's crypto.timingSafeEqual is not
// available in the Workers runtime, so this hand-rolls the XOR-accumulate
// comparison. The length check short-circuits (not constant-time), but a
// token's length is not sensitive here, only its content is, so that leak is
// accepted; this is a hygiene-grade guard, not a cryptographic primitive.
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

// The real gate. Origin headers are trivially spoofed by any script that
// isn't a browser (see the comment in fetch() below), so this shared token is
// what actually stands between the endpoint and a bot spamming empty-cart
// checkout sessions. It is not strong auth: the token ships in the site's
// public JS bundle (see src/lib/checkout.ts on the website), so it stops
// blind/naive scripts hitting the known Worker URL, not a motivated attacker
// willing to read the bundle. Fails closed if the secret itself is unset.
export function guardTokenValid(request: Request, env: Env): boolean {
  const expected = env.CHECKOUT_GUARD_TOKEN ?? "";
  if (!expected) return false;
  const provided = request.headers.get("X-Berrova-Guard") ?? "";
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = (env.SITE_ORIGIN || "https://berrova.com").replace(/\/$/, "");
    const cors = corsHeaders(allowedOrigin);

    // OPTIONS preflight is exempt from both the Origin and guard-token checks
    // below. Browsers issue preflight automatically before a cross-origin POST
    // that carries a custom header (X-Berrova-Guard) or a non-simple
    // Content-Type, and they do so WITHOUT the custom header or body present
    // (that's the point of preflight: asking permission before sending them).
    // Gating preflight on the guard token would make the token itself
    // impossible to deliver, breaking every real browser request. Preflight
    // grants no access on its own, it only reports which headers/methods are
    // allowed, so exempting it costs nothing.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/create-checkout-session") {
      return json({ error: "Not found." }, 404, cors);
    }

    // Hygiene fix, not the real gate: only accept POSTs whose Origin header is
    // present AND matches SITE_ORIGIN. The previous check
    // (`reqOrigin && reqOrigin !== allowedOrigin`) only rejected a MISMATCHED
    // Origin, so any non-browser client (curl, a bot) that simply omitted the
    // Origin header sailed straight through. Origin is still trivially
    // spoofable by a direct script, which never runs in a browser and can set
    // (or omit) any header it likes, so this alone is not real protection,
    // just a bar for browser-originated requests and casual scripts. The
    // actual gate is the guard token below.
    const reqOrigin = request.headers.get("Origin");
    if (!reqOrigin || reqOrigin.replace(/\/$/, "") !== allowedOrigin) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    // The real gate. See guardTokenValid() for what this does and does not do.
    if (!guardTokenValid(request, env)) {
      return json({ error: "Not authorized." }, 403, cors);
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
