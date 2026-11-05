// Guard tests for worker.dashboard.js, the hand-pasted single-file copy of the
// checkout Worker that runs in the Cloudflare dashboard.
//
// WHY THIS FILE EXISTS. src/index.ts gained the CHECKOUT_GUARD_TOKEN gate in
// PR 1 (2026-08-02), but the dashboard copy never did, and the dashboard copy
// is the one Cloudflare actually runs: on 2026-10-20 the live preflight on
// checkout.berrova.com answered `Access-Control-Allow-Headers: Content-Type`,
// which is this file's old shape, not src/index.ts's. Nothing tested this file
// beyond its country list, so the gap was invisible.
//
// What is checked:
//   1. The dashboard copy refuses a POST without the token, with a wrong
//      token, and when the secret itself is unset; it accepts the right one.
//   2. The refusal happens before the body is read and before Stripe is
//      called.
//   3. One request matrix goes through BOTH copies and must get the same
//      status, the same body and the same number of Stripe calls. That is the
//      fence against the two copies drifting apart again.
//   4. The header the website sends is one the dashboard copy's preflight
//      allows. A browser refuses the real POST otherwise, which surfaces in
//      the cart only as "Failed to fetch".
//
// Lives outside src/ for the same reason as mirror-drift.test.ts: tsconfig
// types src/ as Worker code with no Node types, and this file reads disk.
// Only the outbound call to api.stripe.com is mocked.

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import tsWorker from "./src/index";
import dashWorker from "./worker.dashboard.js";

const SITE_ORIGIN = "https://berrova.com";
const GUARD_TOKEN = "test-guard-token-value";
const VALID_CART = { items: [{ id: "shr-8oz", qty: 1, mode: "payment" }] };

type Handler = { fetch(request: Request, env: Record<string, string>): Promise<Response> };
const dash = dashWorker as unknown as Handler;
const ts = tsWorker as unknown as Handler;

function makeEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    STRIPE_SECRET_KEY: "sk_test_fake_for_tests",
    SITE_ORIGIN,
    CHECKOUT_GUARD_TOKEN: GUARD_TOKEN,
    ...overrides,
  };
}

function makeRequest(opts: {
  method?: string;
  path?: string;
  origin?: string | null;
  guardToken?: string | null;
  rawBody?: string;
  body?: unknown;
}): Request {
  const {
    method = "POST",
    path = "/create-checkout-session",
    origin = SITE_ORIGIN,
    guardToken = GUARD_TOKEN,
    rawBody,
    body,
  } = opts;
  const headers: Record<string, string> = {};
  if (origin !== null) headers.Origin = origin;
  if (guardToken !== null) headers["X-Berrova-Guard"] = guardToken;
  let payload: string | undefined;
  if (rawBody !== undefined) payload = rawBody;
  else if (body !== undefined) payload = JSON.stringify(body);
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  return new Request(`https://checkout.berrova.com${path}`, { method, headers, body: payload });
}

let stripeCalls = 0;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  stripeCalls = 0;
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.startsWith("https://api.stripe.com/")) {
      stripeCalls++;
      return new Response(JSON.stringify({ url: "https://checkout.stripe.com/test-session" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected fetch to ${url} in test`);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("worker.dashboard.js guard token", () => {
  it("refuses a POST with no X-Berrova-Guard header: 403, Stripe never called", async () => {
    const res = await dash.fetch(makeRequest({ guardToken: null, body: VALID_CART }), makeEnv());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Not authorized." });
    expect(stripeCalls).toBe(0);
  });

  it("refuses a POST with an empty X-Berrova-Guard header (what the site sends when its token is unset)", async () => {
    const res = await dash.fetch(makeRequest({ guardToken: "", body: VALID_CART }), makeEnv());
    expect(res.status).toBe(403);
    expect(stripeCalls).toBe(0);
  });

  it("refuses a POST with the wrong token: 403, Stripe never called", async () => {
    const res = await dash.fetch(makeRequest({ guardToken: "wrong-token-value-xx", body: VALID_CART }), makeEnv());
    expect(res.status).toBe(403);
    expect(stripeCalls).toBe(0);
  });

  it("refuses a token that differs only in length (prefix of the real one)", async () => {
    const res = await dash.fetch(makeRequest({ guardToken: GUARD_TOKEN.slice(0, -1), body: VALID_CART }), makeEnv());
    expect(res.status).toBe(403);
    expect(stripeCalls).toBe(0);
  });

  it("fails closed when CHECKOUT_GUARD_TOKEN is not set, even if the request carries a token", async () => {
    const res = await dash.fetch(makeRequest({ body: VALID_CART }), makeEnv({ CHECKOUT_GUARD_TOKEN: "" }));
    expect(res.status).toBe(403);
    expect(stripeCalls).toBe(0);
  });

  it("accepts the right token with the right Origin: 200 with the Stripe url, Stripe called once", async () => {
    const res = await dash.fetch(makeRequest({ body: VALID_CART }), makeEnv());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/test-session" });
    expect(stripeCalls).toBe(1);
  });

  it("refuses before reading the body: no token plus invalid JSON is 403, not 400", async () => {
    const res = await dash.fetch(makeRequest({ guardToken: null, rawBody: "{not json" }), makeEnv());
    expect(res.status).toBe(403);
  });

  it("refuses a request with the right token but NO Origin header (the old copy let this through)", async () => {
    const res = await dash.fetch(makeRequest({ origin: null, body: VALID_CART }), makeEnv());
    expect(res.status).toBe(403);
    expect(stripeCalls).toBe(0);
  });

  it("answers OPTIONS preflight with 204 and allows the X-Berrova-Guard header, no token needed", async () => {
    const res = await dash.fetch(makeRequest({ method: "OPTIONS", guardToken: null }), makeEnv());
    expect(res.status).toBe(204);
    const allowed = (res.headers.get("Access-Control-Allow-Headers") ?? "").toLowerCase();
    expect(allowed.split(/\s*,\s*/)).toContain("x-berrova-guard");
  });
});

describe("the website and the dashboard copy agree on the header", () => {
  it("every header the site's checkout fetch sets is allowed by the dashboard copy's preflight", async () => {
    const site = readFileSync(new URL("../src/lib/checkout.ts", import.meta.url), "utf8");
    const m = site.match(/headers:\s*\{([^}]*)\}/);
    if (!m) throw new Error("no headers literal found in src/lib/checkout.ts");
    const sent = [...m[1].matchAll(/"([A-Za-z-]+)"\s*:/g)].map((x) => x[1].toLowerCase());
    expect(sent).toContain("x-berrova-guard");
    const res = await dash.fetch(makeRequest({ method: "OPTIONS", guardToken: null }), makeEnv());
    const allowed = (res.headers.get("Access-Control-Allow-Headers") ?? "")
      .toLowerCase()
      .split(/\s*,\s*/);
    for (const h of sent) expect(allowed, `preflight must allow ${h}`).toContain(h);
  });
});

describe("the two Worker copies give the same answers", () => {
  const cases: Array<{ name: string; req: () => Request; env?: Record<string, string> }> = [
    { name: "valid token and cart", req: () => makeRequest({ body: VALID_CART }) },
    { name: "no token", req: () => makeRequest({ guardToken: null, body: VALID_CART }) },
    { name: "empty token", req: () => makeRequest({ guardToken: "", body: VALID_CART }) },
    { name: "wrong token", req: () => makeRequest({ guardToken: "nope", body: VALID_CART }) },
    { name: "secret unset", req: () => makeRequest({ body: VALID_CART }), env: { CHECKOUT_GUARD_TOKEN: "" } },
    { name: "no Origin", req: () => makeRequest({ origin: null, body: VALID_CART }) },
    { name: "wrong Origin", req: () => makeRequest({ origin: "https://evil.example", body: VALID_CART }) },
    { name: "no token, bad JSON", req: () => makeRequest({ guardToken: null, rawBody: "{" }) },
    { name: "token, bad JSON", req: () => makeRequest({ rawBody: "{" }) },
    { name: "token, empty cart", req: () => makeRequest({ body: { items: [] } }) },
    { name: "token, unknown item", req: () => makeRequest({ body: { items: [{ id: "x", qty: 1, mode: "payment" }] } }) },
    { name: "token, subscription", req: () => makeRequest({ body: { items: [{ id: "shr-16oz", qty: 1, mode: "subscription" }] } }) },
    { name: "token, Stripe key unset", req: () => makeRequest({ body: VALID_CART }), env: { STRIPE_SECRET_KEY: "" } },
    { name: "GET", req: () => makeRequest({ method: "GET" }) },
    { name: "OPTIONS", req: () => makeRequest({ method: "OPTIONS", guardToken: null }) },
  ];

  for (const c of cases) {
    it(`same status, body, Stripe calls and allowed headers: ${c.name}`, async () => {
      const env = makeEnv(c.env ?? {});
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      stripeCalls = 0;
      const a = await ts.fetch(c.req(), env);
      const aCalls = stripeCalls;
      stripeCalls = 0;
      const b = await dash.fetch(c.req(), env);
      const bCalls = stripeCalls;
      errSpy.mockRestore();
      expect(b.status, "status").toBe(a.status);
      expect(await b.text(), "body").toBe(await a.text());
      expect(bCalls, "Stripe calls").toBe(aCalls);
      expect(b.headers.get("Access-Control-Allow-Headers")).toBe(a.headers.get("Access-Control-Allow-Headers"));
    });
  }
});
