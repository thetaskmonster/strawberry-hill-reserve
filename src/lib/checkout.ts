// Client-side checkout glue. Posts a cart or a single subscribe item to the
// Cloudflare Worker, which builds the Stripe Checkout Session from its own
// server-side price map and returns a redirect URL.
//
// CRITICAL GATE: if VITE_CHECKOUT_ENDPOINT is empty/undefined the checkout is
// treated as "not wired yet". Buttons read `checkoutReady` and render disabled,
// so a live deploy before the keys are set looks intentional and never fires a
// dead request. See .env.example.

export type CheckoutMode = "payment" | "subscription";

export type CheckoutItem = {
  id: string;
  qty: number;
  mode: CheckoutMode;
};

// Full endpoint URL, e.g. https://berrova-checkout.<sub>.workers.dev/create-checkout-session
const ENDPOINT = (import.meta.env.VITE_CHECKOUT_ENDPOINT ?? "").trim();

// Shared guard token sent as X-Berrova-Guard, checked against the Worker's
// CHECKOUT_GUARD_TOKEN secret. NOT strong auth: this is a client-side env var
// baked into the shipped JS bundle, so anyone who reads the bundle can read
// it. It exists to raise the bar above blind/naive scripts that hit the known
// Worker URL with no idea a token is required; it does nothing against
// someone who actually inspects the site's JS. See .env.example and
// worker/src/index.ts (guardTokenValid).
const GUARD_TOKEN = (import.meta.env.VITE_CHECKOUT_GUARD_TOKEN ?? "").trim();

export const checkoutReady = ENDPOINT.length > 0;

// Small, user-facing note reused wherever a button is gated off.
export const CHECKOUT_PENDING_NOTE = "Checkout opening soon";

// Posts items and redirects the browser to Stripe on success. Throws on any
// failure so callers can surface a message; never leaks response internals.
export async function startCheckout(items: CheckoutItem[]): Promise<void> {
  if (!checkoutReady) {
    throw new Error("Checkout is not wired up yet.");
  }
  if (items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Berrova-Guard": GUARD_TOKEN },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    throw new Error("We could not start checkout. Please try again.");
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new Error("We could not start checkout. Please try again.");
  }

  window.location.href = data.url;
}
