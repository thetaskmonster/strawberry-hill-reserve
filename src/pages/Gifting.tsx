export default function Gifting() {
  return (
    <>
      <section className="container-page py-16">
        <p className="eyebrow">For teams and clients</p>
        <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Gifting they remember.</h1>
        <p className="lead mt-4">Certified, provable, story-rich coffee, presented well and priced for volume. Your branding, one point of contact.</p>
      </section>

      <section className="container-page grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["01", "Certified, not commodity", "JACRA-certified Blue Mountain and a curated high-grown range. A gift with a story clients can verify."],
          ["02", "Your branding", "Custom cards, notes, presentation. Co-branded boxes for larger runs."],
          ["03", "Volume pricing", "Real quotes at 100+ units. 50% deposit on order, balance at delivery."],
          ["04", "One human contact", "No portal runaround. You talk to a person from quote to delivery."],
        ].map(([n, h, p]) => (
          <div key={n} className="rounded border border-line bg-bg-elev p-5">
            <span className="font-display text-accent" style={{ fontSize: "var(--step-1)" }}>{n}</span>
            <h2 className="mt-2 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{h}</h2>
            <p className="mt-2 font-sans text-sm text-fg-muted">{p}</p>
          </div>
        ))}
      </section>

      <section className="bg-bg-warm py-16" id="inquiry">
        <div className="container-page max-w-2xl">
          <p className="eyebrow">Tell us what you need</p>
          <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Start a gifting inquiry.</h2>
          <p className="lead mt-3">Send the basics and a real person replies with a quote. Nothing is auto-sent, nothing is auto-charged.</p>
          <form className="mt-8 grid gap-4" aria-label="Gifting inquiry">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 font-sans text-sm text-fg-muted">Name<input name="name" required autoComplete="name" className="rounded border border-line bg-bg-film px-3 py-2 text-fg" /></label>
              <label className="grid gap-1 font-sans text-sm text-fg-muted">Company<input name="company" autoComplete="organization" className="rounded border border-line bg-bg-film px-3 py-2 text-fg" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 font-sans text-sm text-fg-muted">Work email<input type="email" name="email" required autoComplete="email" className="rounded border border-line bg-bg-film px-3 py-2 text-fg" /></label>
              <label className="grid gap-1 font-sans text-sm text-fg-muted">Approx. quantity<input name="qty" placeholder="e.g. 100 boxes" className="rounded border border-line bg-bg-film px-3 py-2 text-fg" /></label>
            </div>
            <label className="grid gap-1 font-sans text-sm text-fg-muted">What are you after?<textarea name="message" rows={4} className="rounded border border-line bg-bg-film px-3 py-2 text-fg" /></label>
            <button type="submit" className="justify-self-start rounded bg-accent px-6 py-3 font-sans text-bg-film">Send inquiry</button>
            <p className="font-sans text-sm text-fg-muted">Your inquiry opens an email to our team for review. We reply personally, usually within a business day. (Routing wired in Phase 4; never auto-sends.)</p>
          </form>
        </div>
      </section>
    </>
  );
}
