import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { WAITLIST } from "../content/site";

// Drop-waitlist capture. Posts application/x-www-form-urlencoded so the
// cross-origin request is a CORS "simple request": no preflight, nothing for
// an overzealous client security suite to intercept ahead of the POST.
// The n8n webhook validates the email server-side and answers JSON.

type Phase = "idle" | "busy" | "done" | "error";

export default function WaitlistForm({
  source,
  compact = false,
  pinSource = false,
}: {
  source: string;
  compact?: boolean;
  // When true, "?src=" cannot override `source`. Set it wherever the source
  // records a deliberate CHOICE the visitor made on the page, which outranks
  // how they arrived. See the comment below.
  pinSource?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  // A page-level default (e.g. "home-hero") is the fallback. A "?src=" query
  // param on the URL overrides it, so the same page can be linked from
  // Instagram, TikTok, or a specific post and still land as a distinct row in
  // the Waitlist table's Source column, real attribution, nothing invented.
  //
  // EXCEPT where the caller pins it. Kyle's ruling, 2026-09-08: on the
  // per-origin cards the origin wins. Those sources record which origin the
  // visitor asked for, which is the entire reason that dialog exists, and it
  // is worth more than knowing which link brought them to the page. Without
  // the pin, arriving at "/?src=instagram-bio" and clicking Kenya posted
  // "instagram-bio" and the origin was lost -- measured on the wire by the
  // proof gate, not reasoned about.
  //
  // The campaign tag is NOT lost overall: every page-level form still honours
  // "?src=", so the same visit still attributes if they use one of those.
  //
  // Why a pin rather than carrying both: the n8n webhook maps exactly one
  // field into the Waitlist table's Source column, and that table has no spare
  // column. Carrying both would mean either a composite string nobody can
  // group by, or a schema change to a live automation. Checked, not assumed.
  const [params] = useSearchParams();
  const effectiveSource = pinSource ? source : params.get("src")?.trim() || source;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (phase === "busy") return;
    setPhase("busy");
    try {
      const res = await fetch(WAITLIST.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: email.trim(), source: effectiveSource }),
      });
      const data = (await res.json()) as { ok?: boolean };
      setPhase(res.ok && data.ok ? "done" : "error");
    } catch {
      setPhase("error");
    }
  };

  if (phase === "done") {
    return (
      <p role="status" className="rounded border border-accent bg-white/5 p-4 font-sans text-fg">
        {WAITLIST.success}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "flex flex-col gap-3 sm:flex-row" : "flex flex-col gap-3"}>
      <label className="sr-only" htmlFor={`waitlist-email-${source}`}>Email address</label>
      <input
        id={`waitlist-email-${source}`}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder={WAITLIST.placeholder}
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (phase === "error") setPhase("idle"); }}
        className="w-full rounded border border-line-strong bg-bg-film px-4 py-3 font-sans text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={phase === "busy"}
        className="rounded bg-accent px-6 py-3 font-sans text-bg-film transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {phase === "busy" ? "Joining..." : WAITLIST.button}
      </button>
      {phase === "error" && (
        <p role="alert" className="font-sans text-sm" style={{ color: "var(--danger)" }}>{WAITLIST.failure}</p>
      )}
    </form>
  );
}
