import { FAQ } from "../content/site";

export default function Faq() {
  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">Answers</p>
      <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Questions.</h1>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="cursor-pointer list-none font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{f.q}</summary>
            <p className="mt-3 font-sans text-fg-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
