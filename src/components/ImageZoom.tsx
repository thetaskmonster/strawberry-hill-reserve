// Full-screen image inspector for the product gallery.
//
// WHY IT EXISTS. The gallery frame is a square roughly 450 CSS px wide, and the
// label on the bag carries the regulated net-quantity line and the name of the
// certifying authority in 6-to-8pt type. At gallery size those are unreadable,
// so a buyer being asked for $68 cannot check the one thing the brand is
// selling. This is the control that lets them.
//
// WHY IT IS A SCROLL CONTAINER AND NOT A TRANSFORM. Two sizes, "fit" and
// "actual", with overflow-auto doing the panning. That buys native touch
// panning, native momentum, native keyboard scrolling and native scrollbars on
// every platform, none of which has to be reimplemented or tested here. A
// hand-rolled matrix transform with pointer maths would be more code and more
// ways to trap a user at the wrong offset with no way back.
//
// ACCESSIBILITY. role="dialog" + aria-modal, focus trap, Esc to close, body
// scroll lock, focus returns to the thumbnail that opened it. The focus and
// scrim handling below is copied from OriginWaitlistDialog deliberately,
// including two fixes that file earned the hard way and documents at length:
// onClose is read through a ref so a caller passing a fresh arrow function
// cannot tear the effect down and yank focus mid-interaction, and the scrim is
// a real <button> dismissed on CLICK, because dismissing on mousedown unmounts
// the dialog mid-dispatch and drops the user on <body>.
//
// Do NOT write "mirrors OriginWaitlistDialog" as though that were a guarantee.
// It shares those two fixes and its Tab trap. It has no form in it, so it does
// not share the focus-escape-after-submit case that motivated the trap's
// bounded shape, and the trap is kept bounded here anyway for the same reason:
// a guard that fires only on an expected identity no-ops on every state nobody
// thought of.
//
// House style: no em dashes.

import { useEffect, useRef, useState } from "react";
import { prefersReduced } from "../lib/motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export type ZoomTarget = {
  // The large source. Fetched only when this component renders, which is only
  // while the overlay is open, so the bytes are never on the critical path.
  src: string;
  alt: string;
  // Shown under the controls. Used to say plainly what the viewer is looking
  // at, including where an asset is soft and why.
  note?: string;
};

export default function ImageZoom({
  target,
  onClose,
}: {
  target: ZoomTarget | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const open = target !== null;

  const [actual, setActual] = useState(false);

  // Every open starts fitted. Carrying the previous zoom over means a second
  // open can land mid-image with no visible cue that it is scrolled.
  useEffect(() => {
    if (open) setActual(false);
  }, [open]);

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

  // Focus the scroll region on open so arrow keys pan immediately, trap Tab,
  // close on Esc, restore focus after.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    (scrollRef.current ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

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

      // Bound the failure rather than listing it: if focus is anywhere outside
      // the set, put it back inside. The scroll region is tabIndex 0 and the
      // buttons re-render on the fit/actual toggle, so "active is exactly first
      // or exactly last" is not the only state that reaches here.
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
    // onClose is deliberately NOT in this dependency list; it is read through a
    // ref instead. See the long note in OriginWaitlistDialog: Product passes a
    // fresh arrow function on every render, and listing it here would rebuild
    // this effect on any Product re-render, whose cleanup restores focus to the
    // thumbnail behind a still-open modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!target) return null;

  return (
    // z-[60], not z-50, and MEASURED rather than guessed. Nav is a sticky
    // header at z-50; at equal z-index the nav won on paint order and its links
    // showed through the scrim, on top of a dialog that had just told assistive
    // tech the rest of the page was inert. CartDrawer is at z-[60] for the same
    // reason. Matching it also gives the right precedence if both ever open:
    // the cart is rendered after main, so it sits above this.
    <div className="fixed inset-0 z-[60]" role="presentation">
      {/* A real <button> dismissed on CLICK, not a div on mousedown. See the
          header note and OriginWaitlistDialog's scrim.

          OPAQUE, unlike the 0.72 the other two dialogs use. Those are small
          centred panels where seeing the page behind them is orientation. This
          one fills the viewport and its whole job is letting someone read 6pt
          type, so anything showing through is noise. Tried 0.92 and 0.985 and
          looked at both: the sticky nav's links were still legible through the
          scrim at each, over a dialog that has declared the page inert. No
          backdrop-blur, because there is nothing behind this to blur. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        style={{ background: "#050505" }}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col p-3 sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={target.alt}
          className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Inspect</p>
              {target.note ? (
                <p className="mt-1 font-sans text-xs text-fg-muted">{target.note}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setActual((v) => !v)}
                aria-pressed={actual}
                className="rounded border border-line px-3 py-1 font-sans text-sm text-fg-muted hover:border-accent hover:text-fg"
              >
                {actual ? "Fit to screen" : "Actual size"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-line px-3 py-1 font-sans text-sm text-fg-muted hover:border-accent hover:text-fg"
              >
                Close
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            tabIndex={0}
            aria-label={
              actual
                ? "Image at actual size. Scroll or use the arrow keys to pan."
                : "Image fitted to the screen."
            }
            className={`min-h-0 flex-1 rounded border border-line bg-bg-warm outline-none ${
              actual ? "overflow-auto" : "flex items-center justify-center overflow-hidden"
            }`}
            style={{ transition: prefersReduced() ? "none" : "background var(--dur) ease" }}
          >
            <img
              src={target.src}
              alt={target.alt}
              decoding="async"
              draggable={false}
              className={actual ? "block max-w-none" : "max-h-full max-w-full object-contain"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
