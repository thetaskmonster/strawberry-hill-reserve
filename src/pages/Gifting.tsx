import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import { GIFTING, INQUIRY_EMAIL } from "../content/site";

// Inquiry is SAVED FIRST, then handed to the visitor's email client.
// Nothing is ever auto-sent on their behalf.
//
// THE ORDER IS THE WHOLE POINT. This form used to be a mailto: handoff and
// nothing else: it built a mailto: URL in JS and navigated to it. On a device
// with no mail client configured, or where the scheme navigation is blocked,
// that navigation is a silent no-op. The visitor read "Opening your email
// app..." and nothing happened, and the lead was gone with no trace anywhere.
// Nobody could even count how often it happened, because a lead that never
// arrives leaves no record of not arriving.
//
// Now the inquiry goes to the n8n capture webhook BEFORE mail is opened, so
// the mail step is a convenience rather than the only record.
//
// The copy-it-yourself fallback below is still here, and it is not redundant.
// It covers the case where the SAVE fails too, which is the only remaining
// way to lose the lead. See the two branches in onSubmit: when we hold the
// inquiry the fallback is a nicety shown only if mail did not open; when we
// do not hold it, the fallback is shown unconditionally, because at that
// point the visitor's own send is the only route left and we cannot verify
// whether mail opened.
const MAIL_OPEN_GRACE_MS = 1500;

type Inquiry = { name: string; company: string; email: string; qty: string; message: string };

export default function Gifting() {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState<{ subject: string; body: string } | null>(null);
  // Campaign attribution, same convention as the waitlist form: honour ?src=
  // when it is present, otherwise say plainly where the row came from.
  const [params] = useSearchParams();
  const source = params.get("src")?.trim() || GIFTING.defaultSource;
  const timerRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Tear down any pending watch if the component unmounts mid-attempt.
  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    cleanupRef.current?.();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = e.currentTarget;
    const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement)?.value?.trim() || "";
    // Read every field synchronously. Both the await below and the timer
    // further down outlive e.currentTarget, which React nulls out.
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
    setBusy(true);
    setNote("Sending your inquiry to our team...");

    // SAVE FIRST. Form-encoded so the browser treats this as a CORS simple
    // request and sends it with no preflight, same as the waitlist form.
    //
    // "saved" is only true on an explicit ok from the webhook. A network
    // error, a non-2xx, a body that is not JSON, or a JSON body without
    // ok:true all leave it false, which is the honest reading: we do not
    // hold the inquiry unless we were told we do.
    let saved = false;
    // Set only when the webhook refuses the INPUT (400) and says why. That is
    // a different outcome from a failed save and it gets a different answer:
    // see the branch below.
    let rejected: string | null = null;
    try {
      const res = await fetch(GIFTING.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          name: q.name, company: q.company, email: q.email,
          qty: q.qty, message: q.message, source,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      saved = res.ok && data.ok === true;
      if (!saved && res.status === 400 && typeof data.error === "string" && data.error) {
        rejected = data.error;
      }
    } catch {
      saved = false;
    }
    setBusy(false);

    // THE VISITOR'S TYPO IS NOT OUR OUTAGE. The check above this fetch is
    // presence-only on purpose -- the webhook owns what counts as a valid
    // email, and duplicating that regex here would be the same rule in two
    // places at two ages with no declared winner. The cost of that split is
    // that a malformed address round-trips, and the webhook answers 400 with
    // the sentence that says what to fix.
    //
    // Throwing that sentence away is how "bob" in the email field got
    // reported back as "we could not record your inquiry" -- blaming us for
    // something only they can fix, and then opening a mail draft whose reply
    // address is the malformed one, which helps nobody.
    //
    // So a 400 stops here: show their message, keep them on the form, open no
    // mail, offer no copy-it-yourself panel. There is nothing to recover yet
    // because nothing was lost.
    if (rejected) {
      setNote(rejected);
      return;
    }

    if (saved) {
      setNote("We have your inquiry and we will reply personally. Opening your email app in case you want to add anything. Nothing is auto-sent.");
    } else {
      // We do not hold it. Mail is now the only route, and we cannot verify
      // whether it opens, so show the fallback immediately rather than
      // betting the lead on a blur that may never come.
      setNote("We could not record your inquiry just now, so please send it to us directly. Your email app should open. If it does not, the inquiry is below -- copy it and send it, and we will reply personally.");
      setFallback({ subject, body });
    }

    // Watch for the tab losing focus or visibility. Either means something
    // else took over -- almost always the mail client. If NEITHER happens
    // within the grace window, the navigation went nowhere.
    //
    // This errs in BOTH directions, and the second one is the expensive one,
    // so it is named here rather than left to be discovered.
    //
    // FALSE POSITIVE, cheap: a browser that does not blur on a mailto shows
    // the panel unnecessarily. The visitor sees an ignorable extra block.
    //
    // FALSE NEGATIVE, costly: ANY unrelated blur inside the grace window
    // reads as a successful handoff. Alt-tab, a system notification stealing
    // focus, the phone backgrounding the tab -- all suppress the panel even
    // though no mail app opened.
    //
    // Blur is a PROXY for "the mail client took over" and it cannot tell the
    // two apart, because nothing in the browser reports whether a scheme
    // navigation was handled. That is exactly why the save above runs first
    // and why the not-saved branch does not rely on this watch at all: when
    // the false negative would actually cost a lead, the panel is already up.
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
      if (!saved) return; // the panel is already up, and the note already says so
      setNote("We have your inquiry and we will reply personally. We could not open an email app on this device, so there is nothing for you to do. The text is below if you want to send it as well.");
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
            <button type="submit" disabled={busy} aria-busy={busy}
              className="justify-self-start rounded bg-accent px-6 py-3 font-sans text-bg-film disabled:opacity-60">
              {busy ? "Sending..." : "Send inquiry"}
            </button>
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
