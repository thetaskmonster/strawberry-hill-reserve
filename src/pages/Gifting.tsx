import { useState } from "react";
import Reveal from "../components/Reveal";

// Inquiry routes to a human via the visitor's email client. Never auto-sends.
export default function Gifting() {
  const [note, setNote] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement)?.value?.trim() || "";
    if (!get("name") || !get("email")) {
      setNote("Please add your name and email so we can reply.");
      return;
    }
    const subject = `Gifting inquiry - ${get("company") || get("name")}`;
    const body = `Name: ${get("name")}\nCompany: ${get("company")}\nEmail: ${get("email")}\nQuantity: ${get("qty")}\n\n${get("message")}`;
    setNote("Opening your email app so you can send this to our team. Nothing is auto-sent.");
    window.location.href = `mailto:{{INQUIRY_EMAIL}}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      <section className="container-page py-16">
        <Reveal>
          <p className="eyebrow">For teams and clients</p>
          <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Gifting they remember.</h1>
          <p className="lead mt-4">Certified, provable, story-rich coffee, presented well and priced for volume. Your branding, one point of contact.</p>
        </Reveal>
      </section>

      <section className="container-page grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["01", "Certified, not commodity", "JACRA-certified Blue Mountain and a curated high-grown range. A gift with a story clients can verify."],
          ["02", "Your branding", "Custom cards, notes, presentation. Co-branded boxes for larger runs."],
          ["03", "Volume pricing", "Real quotes at 100+ units. 50% deposit on order, balance at delivery."],
          ["04", "One human contact", "No portal runaround. You talk to a person from quote to delivery."],
        ].map(([n, h, p], i) => (
          <Reveal key={n} delay={i * 0.05}>
            <div className="rounded border border-line bg-bg-elev p-5">
              <span className="font-display text-accent" style={{ fontSize: "var(--step-1)" }}>{n}</span>
              <h2 className="mt-2 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{h}</h2>
              <p className="mt-2 font-sans text-sm text-fg-muted">{p}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="bg-bg-warm py-16" id="inquiry">
        <div className="container-page max-w-2xl">
          <p className="eyebrow">Tell us what you need</p>
          <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Start a gifting inquiry.</h2>
          <p className="lead mt-3">Send the basics and a real person replies with a quote. Nothing is auto-sent, nothing is auto-charged.</p>
          <form className="mt-8 grid gap-4" aria-label="Gifting inquiry" onSubmit={onSubmit} noValidate>
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
            <p className="font-sans text-sm text-fg-muted" role="status" aria-live="polite">{note || "Your inquiry opens an email to our team for review. We reply personally, usually within a business day. Never auto-sends."}</p>
          </form>
        </div>
      </section>
    </>
  );
}
