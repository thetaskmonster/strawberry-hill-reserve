// Tests for the Berrova checkout Worker.
//
// These invoke the actual exported `fetch` handler against real `Request`
// objects (Node 22 has global Request/Response/fetch), so behavior is
// verified end to end through the module, not just the helper functions in
// isolation. Only the outbound call to https://api.stripe.com is mocked, via
// a stubbed globalThis.fetch, so no network call and no real Stripe key are
// needed.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { buildForm, guardTokenValid, parseItems, timingSafeEqual } from "./index";
import type { Env } from "./index";

const SITE_ORIGIN = "https://berrova.com";
const GUARD_TOKEN = "test-guard-token-value";

function makeEnv(overrides: Partial<Env> = {}): Env {
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
  body?: unknown;
}): Request {
  const {
    method = "POST",
    path = "/create-checkout-session",
    origin = SITE_ORIGIN,
    guardToken = GUARD_TOKEN,
    body,
  } = opts;

  const headers: Record<string, string> = {};
  if (origin !== null) headers.Origin = origin;
  if (guardToken !== null) headers["X-Berrova-Guard"] = guardToken;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  return new Request(`https://berrova-checkout.example.workers.dev${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const VALID_CART = { items: [{ id: "shr-8oz", qty: 1, mode: "payment" as const }] };

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false for different length strings", () => {
    expect(timingSafeEqual("short", "much-longer-value")).toBe(false);
  });

  it("returns false when compared against empty string", () => {
    expect(timingSafeEqual("abc123", "")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("guardTokenValid", () => {
  it("accepts a matching token", () => {
    const req = makeRequest({ guardToken: GUARD_TOKEN });
    expect(guardTokenValid(req, makeEnv())).toBe(true);
  });

  it("rejects a wrong token", () => {
    const req = makeRequest({ guardToken: "nope" });
    expect(guardTokenValid(req, makeEnv())).toBe(false);
  });

  it("rejects a missing token header", () => {
    const req = makeRequest({ guardToken: null });
    expect(guardTokenValid(req, makeEnv())).toBe(false);
  });

  it("fails closed if CHECKOUT_GUARD_TOKEN is unset", () => {
    const req = makeRequest({ guardToken: GUARD_TOKEN });
    expect(guardTokenValid(req, makeEnv({ CHECKOUT_GUARD_TOKEN: "" }))).toBe(false);
  });
});

describe("parseItems", () => {
  it("accepts a valid single-item payment cart", () => {
    const result = parseItems(VALID_CART);
    expect(result).toEqual({ items: VALID_CART.items, mode: "payment" });
  });

  it("accepts a valid multi-item payment cart", () => {
    const result = parseItems({
      items: [
        { id: "shr-8oz", qty: 2, mode: "payment" },
        { id: "shr-sample", qty: 1, mode: "payment" },
      ],
    });
    expect("error" in result).toBe(false);
  });

  it("accepts a valid single-item subscription", () => {
    const result = parseItems({ items: [{ id: "shr-8oz", qty: 1, mode: "subscription" }] });
    expect(result).toEqual({
      items: [{ id: "shr-8oz", qty: 1, mode: "subscription" }],
      mode: "subscription",
    });
  });

  it("rejects an empty cart", () => {
    const result = parseItems({ items: [] });
    expect(result).toEqual({ error: "Cart is empty." });
  });

  it("rejects a non-object body", () => {
    expect("error" in parseItems(null)).toBe(true);
    expect("error" in parseItems("nope")).toBe(true);
    expect("error" in parseItems({})).toBe(true);
  });

  it("rejects an unknown item id", () => {
    const result = parseItems({ items: [{ id: "not-a-real-sku", qty: 1, mode: "payment" }] });
    expect("error" in result).toBe(true);
  });

  it("rejects quantity out of range (zero, negative, non-integer, over max)", () => {
    expect("error" in parseItems({ items: [{ id: "shr-8oz", qty: 0, mode: "payment" }] })).toBe(true);
    expect("error" in parseItems({ items: [{ id: "shr-8oz", qty: -1, mode: "payment" }] })).toBe(true);
    expect("error" in parseItems({ items: [{ id: "shr-8oz", qty: 1.5, mode: "payment" }] })).toBe(true);
    expect("error" in parseItems({ items: [{ id: "shr-8oz", qty: 100, mode: "payment" }] })).toBe(true);
  });

  it("rejects an invalid mode", () => {
    const result = parseItems({ items: [{ id: "shr-8oz", qty: 1, mode: "free" }] });
    expect("error" in result).toBe(true);
  });

  it("rejects mixed subscription and payment items", () => {
    const result = parseItems({
      items: [
        { id: "shr-8oz", qty: 1, mode: "subscription" },
        { id: "shr-sample", qty: 1, mode: "payment" },
      ],
    });
    expect(result).toEqual({ error: "A subscription must be a single subscribe item." });
  });

  it("rejects more than one subscription item even if all are subscriptions", () => {
    const result = parseItems({
      items: [
        { id: "shr-8oz", qty: 1, mode: "subscription" },
        { id: "shr-16oz", qty: 1, mode: "subscription" },
      ],
    });
    expect("error" in result).toBe(true);
  });

  it("rejects subscribing to an item with no subscribe price", () => {
    const result = parseItems({ items: [{ id: "shr-giftbox", qty: 1, mode: "subscription" }] });
    expect(result).toEqual({ error: "That item is not available as a subscription." });
  });
});

describe("buildForm", () => {
  it("builds payment line items from PRICE_MAP, not the client", () => {
    const form = buildForm([{ id: "shr-8oz", qty: 2, mode: "payment" }], "payment", SITE_ORIGIN);
    expect(form.get("line_items[0][quantity]")).toBe("2");
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("6800");
    expect(form.get("mode")).toBe("payment");
  });

  it("sets the recurring interval for subscription mode", () => {
    const form = buildForm([{ id: "shr-8oz", qty: 1, mode: "subscription" }], "subscription", SITE_ORIGIN);
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("5900");
    expect(form.get("line_items[0][price_data][recurring][interval]")).toBe("month");
  });
});

describe("worker fetch handler", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("https://api.stripe.com/")) {
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

  it("accept case: correct Origin + correct guard token + valid cart -> 200 with url, hits (mocked) Stripe", async () => {
    const req = makeRequest({ body: VALID_CART });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(200);
    const data = (await res.json()) as { url?: string };
    expect(data.url).toBe("https://checkout.stripe.com/test-session");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(calledUrl)).toBe("https://api.stripe.com/v1/checkout/sessions");
  });

  it("reject A: missing Origin header -> 403", async () => {
    const req = makeRequest({ origin: null, body: VALID_CART });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(403);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject A variant: mismatched Origin header -> 403", async () => {
    const req = makeRequest({ origin: "https://evil.example.com", body: VALID_CART });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(403);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject B: correct Origin, missing guard token -> 403", async () => {
    const req = makeRequest({ guardToken: null, body: VALID_CART });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(403);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject B variant: correct Origin, wrong guard token -> 403", async () => {
    const req = makeRequest({ guardToken: "wrong-token", body: VALID_CART });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(403);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject C: correct Origin + token, empty cart -> 400", async () => {
    const req = makeRequest({ body: { items: [] } });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject C: correct Origin + token, unknown item id -> 400", async () => {
    const req = makeRequest({ body: { items: [{ id: "not-a-real-sku", qty: 1, mode: "payment" }] } });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject C: correct Origin + token, qty out of range -> 400", async () => {
    const req = makeRequest({ body: { items: [{ id: "shr-8oz", qty: 999, mode: "payment" }] } });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject C: correct Origin + token, mixed subscription+payment -> 400", async () => {
    const req = makeRequest({
      body: {
        items: [
          { id: "shr-8oz", qty: 1, mode: "subscription" },
          { id: "shr-sample", qty: 1, mode: "payment" },
        ],
      },
    });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reject D is not a rejection: OPTIONS preflight returns 204 with CORS headers, no guard token needed", async () => {
    const req = makeRequest({ method: "OPTIONS", guardToken: null, body: undefined });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(SITE_ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("X-Berrova-Guard");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("OPTIONS preflight succeeds even with a wrong guard token present, since it's not checked", async () => {
    const req = makeRequest({ method: "OPTIONS", guardToken: "wrong-token", body: undefined });
    const res = await worker.fetch(req, makeEnv());

    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown paths", async () => {
    const req = makeRequest({ path: "/nope", body: VALID_CART });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(404);
  });

  it("returns 500 if STRIPE_SECRET_KEY is unset, without leaking that fact in a guessable way pre-guard", async () => {
    const req = makeRequest({ body: VALID_CART });
    const res = await worker.fetch(req, makeEnv({ STRIPE_SECRET_KEY: "" }));
    expect(res.status).toBe(500);
  });
});
