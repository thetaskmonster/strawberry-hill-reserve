import { useEffect, useRef, useState } from "react";
import Reveal from "../components/Reveal";
import { INQUIRY_EMAIL } from "../content/site";

// Inquiry routes to a human via the visitor's email client. Never auto-sends.
//
// WHY THERE IS A FALLBACK BELOW. This form has no backend: it builds a
// mailto: URL in JS and navigates to it. On a device with no mail client
// configured, or where the scheme navigation is blocked, that navigation is a
// silent no-op -- the visitor read "Opening your email app..." and then
// nothing happened at all, and the lead was lost with no trace anywhere.
// Nobody could even count how often it happened, because a lead that never
// arrives leaves no record of not arriving.
//
// The fix here does NOT make the lead recoverable by us; it makes the failure
// VISIBLE to the visitor, who can then act. If the tab never loses focus
// shortly after the navigation, we assume no mail app took over and show the
// composed inquiry with the address, ready to copy.
//
// STILL OWED: saving the inquiry server-side BEFORE opening mail, so the lead
// survives even if the visitor gives up. The Airtable table exists
// ("Gifting Inquiries") and the capture workflow is written; creating it was
// blocked pending Kyle's approval on 2026-09-08. When that lands, POST here
// first and only open mail on a successful save.
const MAIL_OPEN_GRACE_MS = 1500;

type Inquiry = { name: string; company: string; email: string; qty: string; message: string };

export default function Gifting() {
  const [note, setNote] = useState("");
  const [fallback, setFallback] = useState<{ subject: string; body: string } | null>(null);
  const timerRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Tear down any pending watch if the component unmounts mid-attempt.
  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    cleanupRef.current?.();
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement)?.value?.trim() || "";
    // Read every field synchronously. The watch below fires on a timer, by
    // which point e.currentTarget is null.
    const q: Inquiry = {
      name: get("name"), company: get("company"), email: get("email"),
      qty: get("qty"), message: get("message"),
    };
    if (!q.name || !q.email) {
      setNote("Please add your name and email so we can reply.");
      return;
    }

    const subject = `Gifting inquiry - ${q.company || q.name}`;
    const body = `Name: ${q.name}\nCompany: ${q.company}\nEmail: ${q.email}\nQuantity: ${q.qty}\n\n${q.message}`;

    setFallback(null);
    setNote("Opening your email app so you can send this to our team. Nothing is auto-sent.");

    // Watch for the tab losing focus or visibility. Either means something
    // else took over -- almost always the mail client. If NEITHER happens
    // within the grace window, the navigation went nowhere.
    //
    // Deliberately biased toward showing the fallback: a browser that does
    // not blur on a mailto would show it unnecessarily, which costs the
    // visitor one ignorable panel. The other direction costs a lead.
    let handedOff = false;
    const markHandedOff = () => { handedOff = true; };
    const cleanup = () => {
      window.removeEventListener("blur", markHandedOff);
      document.removeEventListener("visibilitychange", markHandedOff);
      cleanupRef.current = null;
    };
    cleanupRef.current = cleanup;
    window.addEventListener("blur", markHandedOff);
    document.addEventListener("visibilitychange", markHandedOff);

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      cleanup();
      timerRef.current = null;
      if (handedOff || document.hidden) return;
      setNote("We could not open an email app on this device. Your inquiry is below -- copy it and send it to us, and we will reply personally.");
      setFallback({ subject, body });
    }, MAIL_OPEN_GRACE_MS);

    window.location.href = `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function copyInquiry() {
    if (!fallback) return;
    const text = `To: ${INQUIRY_EMAIL}\nSubject: ${fallback.subject}\n\n${fallback.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setNote("Copied. Paste it into an email to us and we will reply personally.");
    } catch {
      // Clipboard can be unavailable or refused. Say so instead of claiming a
      // copy that did not happen -- the text is on screen and selectable.
      setNote("Copy did not work on this device. Select the text below and copy it by hand.");
    }
  }

  return (
    <>
      <section className="container-page py-16">
        <Reveal>
          <p className="eyebrow">For teams and clients</p>
          <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Gifting they remember.</h1>
          <p className="lead mt-4">JACRA-certified coffee, presented well and priced for volume. Your branding, one point of contact.</p>
        </Reveal>
      </section>

      <section className="container-page grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["01", "Certified, not commodity", "JACRA-certified Blue Mountain and a short, high-grown range. A gift that reads as considered, not bulk-bought."],
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

          {fallback && (
            <div className="mt-6 rounded border border-accent bg-bg-film p-4">
              <p className="font-sans text-sm text-fg">Send this to:</p>
              <p className="mt-1 break-all font-sans text-fg-muted">{INQUIRY_EMAIL}</p>
              <label className="mt-4 grid gap-1 font-sans text-sm text-fg-muted">
                Your inquiry
                <textarea
                  readOnly
                  rows={9}
                  className="rounded border border-line bg-bg px-3 py-2 font-sans text-fg"
                  value={`Subject: ${fallback.subject}\n\n${fallback.body}`}
                />
              </label>
              <button
                type="button"
                onClick={copyInquiry}
                className="mt-3 rounded bg-accent px-5 py-2 font-sans text-sm text-bg-film"
              >
                Copy inquiry
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
