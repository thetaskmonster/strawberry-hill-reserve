import { useState } from "react";
import { Link } from "react-router-dom";
import { CLIPS, HERO_LINE, DROP, PRESALE_MODE, SHOW_PRICES, WAITLIST } from "../content/site";
import WaitlistForm from "../components/WaitlistForm";
import { getSku, formatUsd, SHIP_WINDOW } from "../content/store";
import { useCart } from "../store/cart";
import {
  startCheckout,
  checkoutReady,
  CHECKOUT_PENDING_NOTE,
} from "../lib/checkout";
import Reveal from "../components/Reveal";
import ImageZoom, { type ZoomTarget } from "../components/ImageZoom";

// The configurator's size chips map onto the locked store SKUs.
//
// There is deliberately no grind control, and the page deliberately makes no
// claim about grind either. Both halves matter.
//
// No control: Island Coffees stated in writing on 2026-08-11 that whole bean is
// Grade 1/2 and ground is Grade 3. A free Whole bean / Ground choice at one
// price ships a grade the customer did not buy. The settling question is open
// in the vault as GROUND_GRADE_RESOLUTION.
//
// No claim either: a "whole bean only" line was written here and taken back out
// the same day. The page sells a 2 oz sample and a 3 x 2 oz gift box, and the
// only 2 oz line ICL has ever priced to us is GROUND. So that sentence asserted
// something about two SKUs nobody has a whole-bean price for. Whether a 2 oz
// whole-bean package exists is supplier question 17b, unanswered, and what to do
// about it is recorded in the vault as Kyle's call and not made.
//
// Note also that repacking is NOT the reason. ICL's own packaged ground is
// sealed in Jamaica and priced in the MOU, so the repacking ban does not explain
// why we do not sell it. Grade does, and grade stays off the public page while
// question 17 is open.
//
// Where this lives:
//   Strawberry Hill Reserve/00-CONTEXT/ground-truth.md
//   Strawberry Hill Reserve/02-DEPARTMENTS/sales/closing-gift-campaign-sequence.md
//
// Re-open this only when 17 and 17b close, not before.
const SIZE_TO_ID: Record<number, string> = {
  2: "shr-sample",
  8: "shr-8oz",
  16: "shr-16oz",
};

// Gallery views. `zoomSrc` is what the inspector loads, which is a bigger file
// only where a bigger file honestly exists.
//
// The Label view is the one a buyer can actually check, and it is here because
// the bag view cannot do that job. The bag shot is a render: the vault measured
// that rendering silently rewrites the small print on the label, wrong weights
// and a misspelled certifier across roughly half of thirty frames, so it is
// shown at the resolution its text was verified at and no further. The label
// panel is a design file built from vector type at 600 dpi, so it is sharp at
// any zoom and says exactly what the artwork says.
//
// `fit` drives the object-fit class. Do not go back to indexing on `img === 0`:
// that was correct for two views and silently wrong for three.
const VIEWS = [
  {
    label: "Bag",
    src: CLIPS.bag,
    zoomSrc: CLIPS.bag,
    fit: "contain" as const,
    note: "Product render. For the label as printed, open the Label view.",
  },
  { label: "Bean", src: CLIPS.beansPhoto, zoomSrc: CLIPS.beansPhoto, fit: "cover" as const },
  {
    label: "Label",
    src: CLIPS.labelPanel,
    zoomSrc: CLIPS.labelPanelLarge,
    fit: "contain" as const,
    // Said out loud rather than hoped past. The certification roundel is the
    // only part of this artwork that is not vector, and the highest resolution
    // copy anyone holds is 240 px, so it goes soft before the type around it.
    note: "The 8 oz label as printed. The certification mark is the only raster element here, so it softens before the type does.",
  },
];

const chip = (on: boolean) =>
  `rounded border px-4 py-2 font-sans transition-colors ${
    on ? "border-accent bg-white/5 text-accent-strong" : "border-line text-fg hover:border-accent"
  }`;

export default function Product() {
  const [size, setSize] = useState(8);
  const [mode, setMode] = useState<"sub" | "once">("sub");
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState<ZoomTarget | null>(null);
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

  const zoomFor = (i: number): ZoomTarget => ({
    src: VIEWS[i].zoomSrc,
    alt: `${HERO_LINE}, ${VIEWS[i].label.toLowerCase()}`,
    note: VIEWS[i].note,
  });

  return (
    <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
      <div>
        {/* The frame is a button so the image can be inspected. A $68 bag whose
            certification marks are unreadable at gallery size gives a buyer
            nothing to check, which is the whole basis of the price. */}
        <button
          type="button"
          onClick={() => setZoom(zoomFor(img))}
          aria-label={`Enlarge ${VIEWS[img].label.toLowerCase()} image`}
          className="block w-full cursor-zoom-in overflow-hidden rounded border border-line bg-bg-warm"
          style={{ aspectRatio: "1 / 1" }}
        >
          <div className="flex h-full w-full items-center justify-center">
            {/* This is the LCP element on /reserve, so it loads eagerly at high
                priority rather than competing with below-fold media. */}
            <img src={VIEWS[img].src} alt={`${HERO_LINE}, ${VIEWS[img].label.toLowerCase()}`} fetchPriority="high" decoding="async" className={VIEWS[img].fit === "contain" ? "h-full w-auto max-w-[80%] object-contain drop-shadow-2xl" : "h-full w-full object-cover"} />
          </div>
        </button>
        <div className="mt-3 flex gap-3">
          {VIEWS.map((v, i) => (
            <button key={v.label} onClick={() => setImg(i)} aria-pressed={img === i} aria-label={v.label} className={`w-20 overflow-hidden rounded border bg-bg-warm ${img === i ? "border-accent" : "border-line"}`} style={{ aspectRatio: "1 / 1" }}>
              <img src={v.src} alt="" className={v.fit === "contain" ? "h-full w-full object-contain p-1" : "h-full w-full object-cover"} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Reveal>
          <p className="eyebrow">The featured drop</p>
          <h1 className="font-signature text-fg" style={{ fontSize: "var(--step-3)", lineHeight: 1 }}>Strawberry Hill</h1>
          <p className="lead mt-4">JACRA-certified Jamaica Blue Mountain, roasted to order and sealed at origin. A genuine limited quarterly drop.</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-fg-muted">
            <span>JACRA-certified Jamaica Blue Mountain</span>
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

        {PRESALE_MODE === "waitlist" && (
          <div className="mt-8 rounded-lg border border-accent bg-bg-elev p-6">
            <span className="eyebrow">The drop opens {DROP.opens}</span>
            <h2 className="display mt-2 text-fg" style={{ fontSize: "var(--step-2)" }}>{WAITLIST.headline}</h2>
            <p className="mt-3 font-sans text-fg-muted">{WAITLIST.sub}</p>
            <div className="mt-5">
              <WaitlistForm source="reserve" compact />
            </div>
            {/* Pricing is withheld until the drop opens. SHOW_PRICES flips with
                PRESALE_MODE, so every figure returns on the same switch that
                turns the store on. */}
            <p className="mt-4 font-sans text-sm text-fg-muted">
              {SHOW_PRICES
                ? sample
                  ? `Sample ${formatUsd(sku.oneTimeCents)} at the drop.`
                  : subCents !== null
                  ? `${formatUsd(subCents)}/mo subscribed, ${formatUsd(sku.oneTimeCents)} one-time, at the drop.`
                  : `${formatUsd(sku.oneTimeCents)} at the drop.`
                : subCents !== null
                ? "Pricing is announced when the drop opens, with a subscriber rate below the one-time price."
                : "Pricing is announced when the drop opens."}
              {" "}No card now, no commitment. First access only.
            </p>
          </div>
        )}

        {PRESALE_MODE === "live" && (<>
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
          className="mt-8 w-full rounded bg-accent px-6 py-4 font-sans text-bg-film transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Opening checkout..." : cta}
        </button>
        {ctaGated && (
          <p className="mt-2 font-sans text-sm text-fg-muted">{CHECKOUT_PENDING_NOTE}</p>
        )}
        <p className="mt-3 font-sans text-sm text-fg-muted">{SHIP_WINDOW}</p>

        </>)}

        <div className="mt-10 border-t border-line pt-6">
          <span className="eyebrow">Also in the drop</span>
          <div className="mt-3 flex flex-col gap-4 rounded border border-line bg-bg-elev p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-sans text-fg">{giftbox.name}</p>
              <p className="mt-1 font-sans text-sm text-fg-muted">{giftbox.blurb}</p>
              {giftbox.points && (
                <ul className="mt-3 grid gap-1.5">
                  {giftbox.points.map((pt) => (
                    <li key={pt} className="flex gap-2 font-sans text-sm text-fg-muted">
                      <span aria-hidden="true" className="text-accent">/</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {SHOW_PRICES && <span className="font-sans text-fg">{formatUsd(giftbox.oneTimeCents)}</span>}
              {PRESALE_MODE === "live" && (
                <button
                  type="button"
                  onClick={() => { add(giftbox.id, 1); open(); }}
                  className="rounded border border-line-strong px-5 py-2 font-sans text-sm text-fg hover:border-accent"
                >
                  Add to cart
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 font-sans text-sm text-fg-muted">Prefer a different size? <Link to="/reserve" className="text-accent underline">Back to sizes</Link></p>
      </div>

      {/* Renders nothing until opened, so the large sources are never on the
          page's critical path. */}
      <ImageZoom target={zoom} onClose={() => setZoom(null)} />
    </section>
  );
}
