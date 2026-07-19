import MediaPlaceholder from "../components/MediaPlaceholder";
import Token from "../components/Token";

// Structure only (Phase 2). The size/grind/subscribe-or-one-time logic and live
// pricing land in Phase 4 (commerce). Clean and conversion-first, light motion only.
export default function Product() {
  return (
    <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
      <div>
        <MediaPlaceholder label="Strawberry Hill Reserve bag, front (supply real product shot)" kind="product" ratio="1 / 1" />
        <div className="mt-3 flex gap-3">
          <MediaPlaceholder label="Front" kind="product" ratio="1 / 1" />
          <MediaPlaceholder label="Detail (supply)" kind="product" ratio="1 / 1" />
        </div>
      </div>

      <div>
        <p className="eyebrow">The Reserve drop</p>
        <p className="font-signature text-fg" style={{ fontSize: "var(--step-3)", lineHeight: 1 }}>Strawberry Hill</p>
        <h1 className="display mt-1 text-fg" style={{ fontSize: "var(--step-3)" }}>Reserve</h1>
        <p className="lead mt-4">Certified Jamaica Blue Mountain, roasted and sealed at origin. A genuine limited quarterly drop.</p>

        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-fg-muted">
          <span>JACRA cert <Token name="JACRA_CERT_NO" /></span>
          <span>Roasted <Token name="ROAST_DATE" /></span>
          <span><Token name="DROP_UNITS_REMAINING" /> bags this drop</span>
        </p>

        <div className="mt-8">
          <span className="eyebrow">Size</span>
          <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Size">
            <button className="rounded border border-line px-4 py-2 font-sans text-fg">2 oz <span className="text-accent">sample</span></button>
            <button className="rounded border border-accent bg-white/5 px-4 py-2 font-sans text-accent-strong" aria-pressed="true">8 oz</button>
            <button className="rounded border border-line px-4 py-2 font-sans text-fg">16 oz</button>
          </div>
        </div>

        <div className="mt-6">
          <span className="eyebrow">Grind</span>
          <div className="mt-2 flex gap-3" role="group" aria-label="Grind">
            <button className="rounded border border-accent bg-white/5 px-4 py-2 font-sans text-accent-strong" aria-pressed="true">Whole bean</button>
            <button className="rounded border border-line px-4 py-2 font-sans text-fg">Ground</button>
          </div>
        </div>

        <div className="mt-6">
          <span className="eyebrow">How to buy</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-accent bg-bg-elev p-4">
              <span className="eyebrow">Better deal</span>
              <p className="mt-1 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>Subscribe</p>
              <p className="mt-1 font-sans text-sm text-fg-muted">Save on every bag, skip / pause / swap anytime, first access to drops.</p>
            </div>
            <div className="rounded-lg border border-line bg-bg-elev p-4">
              <span className="eyebrow">No commitment</span>
              <p className="mt-1 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>One-time</p>
              <p className="mt-1 font-sans text-sm text-fg-muted">Buy exactly once, no account, no auto-renew.</p>
            </div>
          </div>
        </div>

        <button className="mt-8 w-full rounded bg-accent px-6 py-4 font-sans text-bg-film">Add to cart</button>
        <p className="mt-3 font-sans text-sm text-fg-muted">Presale: fresh-to-order origin batch. Ships in about 2 to 3 weeks; the first drop orders carry a slightly longer window. Stated window honored or refunded (FTC Mail Order Rule).</p>
      </div>
    </section>
  );
}
