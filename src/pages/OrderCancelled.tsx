// Post-checkout cancelled page. Stripe redirects here if the buyer backs out.
// The cart is left intact so they can pick up where they left off.

import { Link } from "react-router-dom";

export default function OrderCancelled() {
  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-measure">
        <p className="eyebrow">Checkout cancelled</p>
        <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>
          No charge made
        </h1>
        <p className="lead mx-auto mt-4">
          Nothing was charged and your cart is still saved. Head back whenever you
          are ready.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/reserve" className="rounded bg-accent px-6 py-3 font-sans text-bg-film">
            Return to the shop
          </Link>
          <Link to="/" className="rounded border border-line-strong px-6 py-3 font-sans text-fg">
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
