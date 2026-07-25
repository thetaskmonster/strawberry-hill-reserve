// Post-checkout success page. Stripe redirects here after payment.
// Clears the cart once, confirms the order, and repeats the ship window.
// No fabricated order numbers or totals: Stripe emails the receipt.

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/cart";
import { SHIP_WINDOW } from "../content/store";

export default function OrderSuccess() {
  const { clear } = useCart();

  useEffect(() => {
    // The cart's job is done once Stripe has taken payment.
    clear();
  }, [clear]);

  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-measure">
        <p className="eyebrow">Order confirmed</p>
        <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>
          Thank you
        </h1>
        <p className="lead mx-auto mt-4">
          Your order is in. A receipt is on its way to your email from Stripe.
        </p>
        <p className="mx-auto mt-6 max-w-measure rounded border border-line bg-bg-elev p-4 font-sans text-sm text-fg-muted">
          {SHIP_WINDOW}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="rounded bg-accent px-6 py-3 font-sans text-bg-film">
            Back home
          </Link>
          <Link to="/reserve" className="rounded border border-line-strong px-6 py-3 font-sans text-fg">
            See the drop
          </Link>
        </div>
      </div>
    </section>
  );
}
