import { useState, type FormEvent } from "react";
import { WAITLIST } from "../content/site";

// Drop-waitlist capture. Posts application/x-www-form-urlencoded so the
// cross-origin request is a CORS "simple request": no preflight, nothing for
// an overzealous client security suite to intercept ahead of the POST.
// The n8n webhook validates the email server-side and answers JSON.

type Phase = "idle" | "busy" | "done" | "error";

export default function WaitlistForm({ source, compact = false }: { source: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (phase === "busy") return;
    setPhase("busy");
    try {
      const res = await fetch(WAITLIST.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: email.trim(), source }),
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
