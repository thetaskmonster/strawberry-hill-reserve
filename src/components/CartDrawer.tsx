// Cart drawer. Slide-in from the right, brand tokens only.
// Accessibility: role="dialog" + aria-modal, focus trap, Esc to close, focus
// returns to the trigger, and prefers-reduced-motion collapses the slide to an
// instant show/hide (the CSS transition uses var(--dur), which tokens.css sets
// to 1ms under reduced motion).
//
// House style: no em dashes.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/cart";
import { getSku, formatUsd, SHIP_WINDOW } from "../content/store";
import {
  startCheckout,
  checkoutReady,
  CHECKOUT_PENDING_NOTE,
  type CheckoutItem,
} from "../lib/checkout";
import { prefersReduced } from "../lib/motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export default function CartDrawer() {
  const { lines, subtotalCents, setQty, remove, isOpen, close } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mount/unmount with an entrance transition; exit is instant under reduced
  // motion, otherwise waits out the slide before unmounting.
  useEffect(() => {
    if (isOpen) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const delay = prefersReduced() ? 0 : 300;
    const t = window.setTimeout(() => {
      setMounted(false);
      // Return focus to whatever opened the drawer.
      restoreRef.current?.focus?.();
    }, delay);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Lock body scroll while mounted, compensating for the scrollbar width so the
  // page underneath does not shift.
  useEffect(() => {
    if (!mounted) return;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevPad = style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = "hidden";
    if (sbw > 0) style.paddingRight = `${sbw}px`;
    return () => {
      style.overflow = prevOverflow;
      style.paddingRight = prevPad;
    };
  }, [mounted]);

  // Focus the panel on open, trap Tab, close on Esc.
  useEffect(() => {
    if (!mounted || !isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusFirst = () => {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [mounted, isOpen, close, lines.length]);

  if (!mounted) return null;

  const onCheckout = async () => {
    setError(null);
    setBusy(true);
    try {
      const items: CheckoutItem[] = lines.map((l) => ({
        id: l.id,
        qty: l.qty,
        mode: "payment",
      }));
      await startCheckout(items);
      // On success the browser has already been redirected to Stripe.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const empty = lines.length === 0;

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity var(--dur) var(--ease-out)",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-[26rem] flex-col border-l border-line-strong bg-bg-warm shadow-[var(--shadow-lift)] outline-none"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform var(--dur) var(--ease-out)",
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="eyebrow" style={{ fontSize: "var(--step--1)" }}>
            Your cart
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="rounded border border-line p-2 text-fg hover:border-accent"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {empty ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="font-sans text-fg">Your cart is empty.</p>
                <p className="mt-2 font-sans text-sm text-fg-muted">
                  Add a bag of the reserve to get started.
                </p>
                <Link
                  to="/reserve"
                  onClick={close}
                  className="mt-5 inline-block rounded border border-line-strong px-5 py-2 font-sans text-sm text-fg hover:border-accent"
                >
                  See the drop
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((l) => {
                const sku = getSku(l.id);
                if (!sku) return null;
                return (
                  <li key={l.id} className="flex gap-3 border-b border-line pb-4">
                    <div className="flex-1">
                      <p className="font-sans text-fg">{sku.name}</p>
                      <p className="font-sans text-sm text-fg-muted">{sku.size}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded border border-line" role="group" aria-label={`Quantity for ${sku.name}`}>
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.qty - 1)}
                            aria-label={`Decrease quantity of ${sku.name}`}
                            className="px-3 py-1 text-fg hover:text-accent"
                          >
                            &minus;
                          </button>
                          <span className="min-w-[2ch] text-center font-sans text-sm text-fg" aria-live="polite">
                            {l.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.qty + 1)}
                            aria-label={`Increase quantity of ${sku.name}`}
                            className="px-3 py-1 text-fg hover:text-accent"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          className="ml-1 font-sans text-sm text-fg-muted underline hover:text-fg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="font-sans text-fg">
                      {formatUsd(sku.oneTimeCents * l.qty)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!empty && (
          <div className="border-t border-line px-5 py-4">
            <div className="flex items-center justify-between font-sans text-fg">
              <span>Subtotal</span>
              <span>{formatUsd(subtotalCents)}</span>
            </div>
            <p className="mt-1 font-sans text-sm text-fg-muted">
              Shipping and any taxes are calculated at checkout.
            </p>

            <p className="mt-4 rounded border border-line bg-bg-elev p-3 font-sans text-sm text-fg-muted">
              {SHIP_WINDOW}
            </p>

            {error && (
              <p role="alert" className="mt-3 font-sans text-sm" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={onCheckout}
              disabled={!checkoutReady || busy}
              aria-disabled={!checkoutReady || busy}
              className="mt-4 w-full rounded bg-accent px-6 py-3 font-sans text-bg-film transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Opening checkout..." : "Checkout"}
            </button>
            {!checkoutReady && (
              <p className="mt-2 text-center font-sans text-sm text-fg-muted">
                {CHECKOUT_PENDING_NOTE}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
