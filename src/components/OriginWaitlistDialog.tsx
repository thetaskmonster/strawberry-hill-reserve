// Per-origin waitlist dialog. Opened from an origin card on the home page for
// any origin in the "waitlist" state (Kenya, Ethiopia), so intent captured on
// the card lands as its own row rather than being routed to the generic drop
// form further down the page.
//
// Accessibility: role="dialog" + aria-modal, focus trap, Esc to close, body
// scroll lock, focus returns to the card that opened it.
//
// DO NOT write "mirrors CartDrawer" here. That sentence stood in this file
// through two rounds and was false in a different direction each time: first
// because the scrim did NOT match CartDrawer's and dropped focus on <body>,
// then because the Tab trap below is now STRONGER than CartDrawer's, which
// still only handles focus being identically the first or last item. A reader
// who trusts the sentence assumes CartDrawer is equally guarded. It is not.
//
// House style: no em dashes.

import { useEffect, useRef } from "react";
import WaitlistForm from "./WaitlistForm";
import { prefersReduced } from "../lib/motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export type OriginDialogTarget = {
  name: string;
  place: string;
  // Waitlist Source column value, e.g. "origin-kenya". Real attribution, so a
  // Kenya signup is separable from an Ethiopia one and from the drop form.
  source: string;
};

export default function OriginWaitlistDialog({
  target,
  onClose,
}: {
  target: OriginDialogTarget | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  // Latest onClose, so the key-handling effect below never has to depend on
  // its identity. See the note on that effect's dependency list.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const open = target !== null;

  // Remember the trigger so focus can go back to it on close.
  useEffect(() => {
    if (open) restoreRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Lock body scroll while open, compensating for scrollbar width so the page
  // underneath does not shift.
  useEffect(() => {
    if (!open) return;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevPad = style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = "hidden";
    if (sbw > 0) style.paddingRight = `${sbw}px`;
    return () => {
      style.overflow = prevOverflow;
      style.paddingRight = prevPad;
    };
  }, [open]);

  // Focus the email field on open, trap Tab, close on Esc, restore focus after.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const input = panel.querySelector<HTMLElement>('input[type="email"]');
    (input ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Focus can leave the set entirely, and this is not hypothetical: on a
      // successful signup WaitlistForm replaces the whole form -- including the
      // submit button that currently has focus -- with a status paragraph, and
      // focus drops to <body>. Without this branch Tab then walks straight out
      // of an aria-modal dialog into the page behind it, which the modal has
      // just told assistive tech is inert.
      //
      // The general shape: a guard that only fires on an EXPECTED IDENTITY
      // (active === first, active === last) silently no-ops on every state
      // nobody thought of. Bound the failure instead of listing it.
      if (!active || !panel.contains(active) || !items.includes(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
    // onClose is deliberately NOT in this dependency list; it is read through
    // a ref instead.
    //
    // The proof gate found this on 2026-09-08. Home passes a fresh arrow
    // function as onClose on every render, so listing it here tore this effect
    // down and rebuilt it on any Home re-render, and the cleanup restores
    // focus to the card. Home re-renders on a 60-second countdown timer; most
    // ticks set the same value and React bails out, but the once-a-day
    // rollover does not. Observed with the clock run fast, with the user
    // typing an email and then doing nothing at all:
    //
    //   OUT BUTTON|Kenya, Nyeri, high-grown. Join the waitlist.
    //   IN  INPUT|
    //
    // Focus jumped to the card BEHIND a still-open aria-modal dialog and then
    // back to the email field, discarding wherever the user was. A modal must
    // never move focus without the user asking.
    //
    // The ref is the fix rather than useCallback in Home, because it makes the
    // dialog correct against ANY caller. A useCallback in Home fixes today's
    // one caller and silently breaks again the first time somebody adds a
    // second one. Bound the failure, do not list it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Scrim. A real <button> dismissed on CLICK, not a div on mousedown:
          mousedown unmounts the dialog mid-dispatch, so the focus restore runs
          and is then overwritten by the browser's own post-mousedown adjustment
          (the pressed element no longer exists) and the user is dropped on
          <body>. Escape has no competing default action, which is why only the
          backdrop path was affected. Same shape as CartDrawer's scrim. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        style={{ background: "rgba(5,5,5,0.72)", backdropFilter: "blur(2px)" }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="origin-dialog-h"
        tabIndex={-1}
        className="pointer-events-auto w-full max-w-md rounded-lg border border-accent bg-bg-elev p-6 outline-none sm:p-8"
        style={{ transition: prefersReduced() ? "none" : "opacity var(--dur) ease" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Waitlist</p>
            <h2
              id="origin-dialog-h"
              className="display mt-2 text-fg"
              style={{ fontSize: "var(--step-2)" }}
            >
              {target.name}
            </h2>
            <p className="mt-1 font-sans text-xs uppercase tracking-wide text-accent">
              {target.place}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded border border-line px-3 py-1 font-sans text-sm text-fg-muted hover:border-accent hover:text-fg"
          >
            Close
          </button>
        </div>

        <p className="mt-4 font-sans text-fg-muted">
          This origin is not sourced yet. Leave your email and you are told first
          when it lands, before it opens to anyone else.
        </p>

        <div className="mt-5">
          <WaitlistForm source={target.source} pinSource />
        </div>

        <p className="mt-4 font-sans text-sm text-fg-muted">
          No card, no commitment. First access only.
        </p>
      </div>
      </div>
    </div>
  );
}
