import { Link } from "react-router-dom";

export default function Wholesale() {
  return (
    <section className="container-page py-16">
      <p className="eyebrow">For cafes, roasters, and fine dining</p>
      <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Wholesale.</h1>
      <p className="lead mt-4">Certified Blue Mountain and a short high-grown range for the top of your menu. Volume pricing, a real person on the other end, no auto-quotes.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Certified, traceable", "JACRA certificate and traceable lots, so what you pour is what you say it is."],
          ["Supply that holds", "Quarterly Reserve plus a steady house range, so the menu never goes dark."],
          ["One contact", "A direct line from first sample to standing order."],
        ].map(([h, p]) => (
          <div key={h} className="rounded border border-line bg-bg-elev p-5">
            <h2 className="font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{h}</h2>
            <p className="mt-2 font-sans text-sm text-fg-muted">{p}</p>
          </div>
        ))}
      </div>
      <Link to="/gifting#inquiry" className="mt-10 inline-block rounded bg-accent px-6 py-3 font-sans text-bg-film">Request wholesale pricing</Link>
    </section>
  );
}
