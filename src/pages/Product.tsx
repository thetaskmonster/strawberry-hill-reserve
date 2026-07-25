import { useState } from "react";
import { Link } from "react-router-dom";
import { CLIPS, HERO_LINE, DROP } from "../content/site";
import { getSku, formatUsd, SHIP_WINDOW } from "../content/store";
import { useCart } from "../store/cart";
import {
  startCheckout,
  checkoutReady,
  CHECKOUT_PENDING_NOTE,
} from "../lib/checkout";
import Reveal from "../components/Reveal";

// The configurator's size chips map onto the locked store SKUs. Grind is a
// product option only; it does not change price and the Worker builds the Stripe
// line item from the SKU id alone, so grind is not yet a priced variant.
const SIZE_TO_ID: Record<number, string> = {
  2: "shr-sample",
  8: "shr-8oz",
  16: "shr-16oz",
};

const VIEWS = [
  { label: "Bag", src: CLIPS.bag },
  { label: "Bean", src: CLIPS.beansPhoto },
];

const chip = (on: boolean) =>
  `rounded border px-4 py-2 font-sans transition-colors ${
    on ? "border-accent bg-white/5 text-accent-strong" : "border-line text-fg hover:border-accent"
  }`;

export default function Product() {
  const [size, setSize] = useState(8);
  const [grind, setGrind] = useState("whole");
  const [mode, setMode] = useState<"sub" | "once">("sub");
  const [img, setImg] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { add, open } = useCart();

  const sku = getSku(SIZE_TO_ID[size])!;
  const sample = sku.subscribeCents === null;
  const effMode = sample ? "once" : mode;
  const subCents = sku.subscribeCents;

  const cta = sample
    ? `Add sample to cart -- ${formatUsd(sku.oneTimeCents)}`
    : effMode === "sub" && subCents !== null
    ? `Subscribe -- ${formatUsd(subCents)}/mo`
    : `Add to cart -- ${formatUsd(sku.oneTimeCents)}`;

  // Subscribe redirects to Stripe directly; one-time drops into the cart drawer.
  const subscribeMode = effMode === "sub" && !sample;
  const ctaGated = subscribeMode && !checkoutReady;

  const onCta = async () => {
    if (subscribeMode) {
      setError(null);
      setBusy(true);
      try {
        await startCheckout([{ id: sku.id, qty: 1, mode: "subscription" }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setBusy(false);
      }
      return;
    }
    add(sku.id, 1);
    open();
  };

  const giftbox = getSku("shr-giftbox")!;

  return (
    <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-center overflow-hidden rounded border border-line bg-bg-warm" style={{ aspectRatio: "1 / 1" }}>
          <img src={VIEWS[img].src} alt={`${HERO_LINE}, ${VIEWS[img].label.toLowerCase()}`} className={img === 0 ? "h-full w-auto max-w-[80%] object-contain drop-shadow-2xl" : "h-full w-full object-cover"} />
        </div>
        <div className="mt-3 flex gap-3">
          {VIEWS.map((v, i) => (
            <button key={v.label} onClick={() => setImg(i)} aria-pressed={img === i} aria-label={v.label} className={`w-20 overflow-hidden rounded border bg-bg-warm ${img === i ? "border-accent" : "border-line"}`} style={{ aspectRatio: "1 / 1" }}>
              <img src={v.src} alt="" className={i === 0 ? "h-full w-full object-contain p-1" : "h-full w-full object-cover"} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Reveal>
          <p className="eyebrow">The featured drop</p>
          <p className="font-signature text-fg" style={{ fontSize: "var(--step-3)", lineHeight: 1 }}>Strawberry Hill</p>
          <h1 className="display mt-1 text-fg" style={{ fontSize: "var(--step-3)" }}>Reserve</h1>
          <p className="lead mt-4">Certified Jamaica Blue Mountain, roasted to order and sealed at origin. A genuine limited quarterly drop.</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-fg-muted">
            <span>Certified Jamaica Blue Mountain</span>
            <span>Roasted to order</span>
            <span>{DROP.units} bags this drop</span>
          </p>
        </Reveal>

        <div className="mt-8">
          <span className="eyebrow">Size</span>
          <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Size">
            <button className={chip(size === 2)} aria-pressed={size === 2} onClick={() => setSize(2)}>2 oz <span className="text-accent">sample</span></button>
            <button className={chip(size === 8)} aria-pressed={size === 8} onClick={() => setSize(8)}>8 oz</button>
            <button className={chip(size === 16)} aria-pressed={size === 16} onClick={() => setSize(16)}>16 oz</button>
          </div>
          {sample && <p className="mt-2 font-sans text-sm text-fg-muted">Sample size, one-time only. The low-risk way to taste it before you commit to a bag.</p>}
        </div>

        <div className="mt-6">
          <span className="eyebrow">Grind</span>
          <div className="mt-2 flex gap-3" role="group" aria-label="Grind">
            <button className={chip(grind === "whole")} aria-pressed={grind === "whole"} onClick={() => setGrind("whole")}>Whole bean</button>
            <button className={chip(grind === "ground")} aria-pressed={grind === "ground"} onClick={() => setGrind("ground")}>Ground</button>
          </div>
        </div>

        <div className="mt-6">
          <span className="eyebrow">How to buy</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={sample}
              aria-pressed={effMode === "sub"}
              onClick={() => setMode("sub")}
              className={`rounded-lg border p-4 text-left transition ${effMode === "sub" && !sample ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line"} ${sample ? "opacity-40" : ""}`}
            >
              <span className="eyebrow">Better deal</span>
              <p className="mt-1 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>Subscribe {sample || subCents === null ? "" : <span className="text-accent-strong">{formatUsd(subCents)}/mo</span>}</p>
              <p className="mt-1 font-sans text-sm text-fg-muted">Save on every bag, skip / pause / swap anytime, first access to drops.</p>
            </button>
            <button
              type="button"
              aria-pressed={effMode === "once"}
              onClick={() => setMode("once")}
              className={`rounded-lg border p-4 text-left transition ${effMode === "once" ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line"}`}
            >
              <span className="eyebrow">No commitment</span>
              <p className="mt-1 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>One-time <span className="text-accent-strong">{formatUsd(sku.oneTimeCents)}</span></p>
              <p className="mt-1 font-sans text-sm text-fg-muted">Buy exactly once, no account, no auto-renew.</p>
            </button>
          </div>
        </div>

        {effMode === "sub" && !sample && (
          <div className="mt-6 rounded border border-line bg-bg-elev p-4">
            <span className="eyebrow">Your subscription, your control</span>
            <div className="mt-3 grid grid-cols-2 gap-3 font-sans text-sm text-fg-muted sm:grid-cols-4">
              <div><strong className="block text-fg">Cadence</strong>Monthly</div>
              <div><strong className="block text-fg">Skip</strong>One click</div>
              <div><strong className="block text-fg">Pause</strong>Anytime</div>
              <div><strong className="block text-fg">Cancel</strong>Self-serve</div>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 font-sans text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        )}

        <button
          type="button"
          onClick={onCta}
          disabled={ctaGated || busy}
          aria-disabled={ctaGated || busy}
          data-grind={grind}
          className="mt-8 w-full rounded bg-accent px-6 py-4 font-sans text-bg-film transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Opening checkout..." : cta}
        </button>
        {ctaGated && (
          <p className="mt-2 font-sans text-sm text-fg-muted">{CHECKOUT_PENDING_NOTE}</p>
        )}
        <p className="mt-3 font-sans text-sm text-fg-muted">{SHIP_WINDOW}</p>

        <div className="mt-10 border-t border-line pt-6">
          <span className="eyebrow">Also in the drop</span>
          <div className="mt-3 flex flex-col gap-3 rounded border border-line bg-bg-elev p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-sans text-fg">{giftbox.name}</p>
              <p className="mt-1 font-sans text-sm text-fg-muted">{giftbox.blurb}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-sans text-fg">{formatUsd(giftbox.oneTimeCents)}</span>
              <button
                type="button"
                onClick={() => { add(giftbox.id, 1); open(); }}
                className="rounded border border-line-strong px-5 py-2 font-sans text-sm text-fg hover:border-accent"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 font-sans text-sm text-fg-muted">Prefer a different size? <Link to="/reserve" className="text-accent underline">Back to sizes</Link></p>
      </div>
    </section>
  );
}
