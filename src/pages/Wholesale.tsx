export default function Wholesale() {
  return (
    <section className="container-page py-16">
      <p className="eyebrow">For cafes, roasters, and fine dining</p>
      <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Wholesale.</h1>
      <p className="lead mt-4">Certified Blue Mountain and a curated high-grown range for the top of your menu. Volume pricing, a real person on the other end, no auto-quotes.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Provable authenticity", "JACRA certificate and traceable lots your guests can trust."],
          ["Consistent supply", "Quarterly Reserve plus a steady house range so your menu never goes dark."],
          ["One contact", "Direct line from sample to standing order."],
        ].map(([h, p]) => (
          <div key={h} className="rounded border border-line bg-bg-elev p-5">
            <h2 className="font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{h}</h2>
            <p className="mt-2 font-sans text-sm text-fg-muted">{p}</p>
          </div>
        ))}
      </div>
      <a href="/gifting#inquiry" className="mt-10 inline-block rounded bg-accent px-6 py-3 font-sans text-bg-film">Request wholesale pricing</a>
    </section>
  );
}
