import { Link } from "react-router-dom";
import type { LegalDoc } from "../content/legal";
import { LEGAL_LINKS, LEGAL_UPDATED } from "../content/legal";

// One layout for every policy page. Clean-commerce side of the split: no
// motion, real headings in order, readable measure.
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">{doc.eyebrow}</p>
      <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>{doc.title}</h1>
      <p className="mt-2 font-sans text-sm text-fg-muted">Last updated {LEGAL_UPDATED}.</p>
      <p className="lead mt-6">{doc.intro}</p>

      <div className="mt-10 space-y-10">
        {doc.sections.map((s) => (
          <section key={s.heading} aria-labelledby={slug(s.heading)}>
            <h2 id={slug(s.heading)} className="font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-3 font-sans text-fg-muted">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-6 font-sans text-fg-muted">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {s.after?.map((p) => (
              <p key={p} className="mt-3 font-sans text-fg-muted">{p}</p>
            ))}
          </section>
        ))}
      </div>

      <nav aria-label="Policies" className="mt-14 border-t border-line pt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-fg-muted">
          {LEGAL_LINKS.filter((l) => l.to !== doc.path).map((l) => (
            <li key={l.to}><Link to={l.to} className="hover:text-fg">{l.label}</Link></li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

function slug(s: string): string {
  return "s-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
