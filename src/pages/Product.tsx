import { useState } from "react";
import { Link } from "react-router-dom";
import MediaPlaceholder from "../components/MediaPlaceholder";
import Token from "../components/Token";
import Reveal from "../components/Reveal";

// Real, user-set prices (decisions, not fabricated proof). 2oz is a one-time sample.
const PRICES: Record<number, { sub?: number; once: number; sample?: boolean }> = {
  2: { once: 14, sample: true },
  8: { sub: 59, once: 68 },
  16: { sub: 109, once: 125 },
};

const chip = (on: boolean) =>
  `rounded border px-4 py-2 font-sans transition-colors ${
    on ? "border-accent bg-white/5 text-accent-strong" : "border-line text-fg hover:border-accent"
  }`;

export default function Product() {
  const [size, setSize] = useState(8);
  const [grind, setGrind] = useState("whole");
  const [mode, setMode] = useState<"sub" | "once">("sub");
  const [img, setImg] = useState(0);

  const p = PRICES[size];
  const sample = !!p.sample;
  const effMode = sample ? "once" : mode;
  const price = effMode === "sub" && p.sub ? p.sub : p.once;
  const cta = sample
    ? `Add sample to cart - $${p.once}`
    : effMode === "sub"
    ? `Subscribe - $${p.sub}/mo`
    : `Add to cart - $${p.once}`;

  return (
    <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
      <div>
        <MediaPlaceholder label={`Strawberry Hill Reserve bag, ${img === 0 ? "front" : "detail"} (supply real product shot)`} kind="product" ratio="1 / 1" />
        <div className="mt-3 flex gap-3">
          {["Front", "Detail"].map((t, i) => (
            <button key={t} onClick={() => setImg(i)} aria-pressed={img === i} aria-label={t} className={`w-20 overflow-hidden rounded border ${img === i ? "border-accent" : "border-line"}`}>
              <MediaPlaceholder label={t} kind="product" ratio="1 / 1" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Reveal>
          <p className="eyebrow">The Reserve drop</p>
          <p className="font-signature text-fg" style={{ fontSize: "var(--step-3)", lineHeight: 1 }}>Strawberry Hill</p>
          <h1 className="display mt-1 text-fg" style={{ fontSize: "var(--step-3)" }}>Reserve</h1>
          <p className="lead mt-4">Certified Jamaica Blue Mountain, roasted and sealed at origin. A genuine limited quarterly drop.</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-fg-muted">
            <span>JACRA cert <Token name="JACRA_CERT_NO" /></span>
            <span>Roasted <Token name="ROAST_DATE" /></span>
            <span><Token name="DROP_UNITS_REMAINING" /> bags this drop</span>
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
              <p className="mt-1 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>Subscribe {sample ? "" : <span className="text-accent-strong">${p.sub}/mo</span>}</p>
              <p className="mt-1 font-sans text-sm text-fg-muted">Save on every bag, skip / pause / swap anytime, first access to drops.</p>
            </button>
            <button
              type="button"
              aria-pressed={effMode === "once"}
              onClick={() => setMode("once")}
              className={`rounded-lg border p-4 text-left transition ${effMode === "once" ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line"}`}
            >
              <span className="eyebrow">No commitment</span>
              <p className="mt-1 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>One-time <span className="text-accent-strong">${p.once}</span></p>
              <p className="mt-1 font-sans text-sm text-fg-muted">Buy exactly once, no account, no auto-renew.</p>
            </button>
          </div>
        </div>

        {effMode === "sub" && !sample && (
          <div className="mt-6 rounded border border-line bg-bg-elev p-4">
            <span className="eyebrow">Your subscription, your control</span>
            <div className="mt-3 grid grid-cols-2 gap-3 font-sans text-sm text-fg-muted sm:grid-cols-4">
              <div><strong className="block text-fg">Cadence</strong>Every 2-8 weeks</div>
              <div><strong className="block text-fg">Skip</strong>One click</div>
              <div><strong className="block text-fg">Pause</strong>30 / 60 / 90 days</div>
              <div><strong className="block text-fg">Swap</strong>Origin, size, grind</div>
            </div>
          </div>
        )}

        <button className="mt-8 w-full rounded bg-accent px-6 py-4 font-sans text-bg-film" data-price={price} data-grind={grind}>{cta}</button>
        <p className="mt-3 font-sans text-sm text-fg-muted">Presale: fresh-to-order origin batch. Ships in about 2 to 3 weeks; the first drop orders carry a slightly longer window. Stated window honored or refunded (FTC Mail Order Rule). Checkout wires to the store at build.</p>
        <p className="mt-2 font-sans text-sm text-fg-muted">Prefer a full bag? <Link to="/reserve" className="text-accent underline">Back to sizes</Link></p>
      </div>
    </section>
  );
}
