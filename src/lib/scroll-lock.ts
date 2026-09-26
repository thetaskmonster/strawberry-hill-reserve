// One scroll lock for every modal surface (OriginWaitlistDialog, CartDrawer).
//
// Locks on <html>, NOT <body>, and the reason was measured, not guessed.
// global.css sets `html, body { overflow-x: clip }`. Once <html> is not
// `overflow: visible` in both axes, the browser stops propagating <body>'s
// overflow up to the viewport, so a body-level `overflow: hidden` turns body
// into its own scroll container instead of locking the page. What followed,
// observed 2026-09-26 on Chromium with the Kenya dialog opened from its card
// (page about 3,500px down): the sticky header's nearest scrollport became
// <body>, whose own scroll offset is 0, so header.getBoundingClientRect().top
// read -3509 with the dialog open and 0 with it closed. The header left the
// screen for as long as any modal was up, and came back when it closed.
//
// The viewport's overflow IS <html>'s, so setting it here locks the page the
// way the old body-level code said it did, and the header keeps sticking to
// the viewport while the modal is open. Issue #21.
//
// Scrollbar compensation stays on <body>: that is the box whose content would
// widen when the viewport's scrollbar disappears. Measure the gutter BEFORE
// locking; after the lock, clientWidth equals innerWidth and the number is 0.
//
// Returns the release. Callers do `useEffect(() => { ...; return lockScroll(); })`.
// Two modals open at once restore in unmount order, last one wins, which is
// the same behaviour the two separate copies of this had before.
export function lockScroll(): () => void {
  const root = document.documentElement;
  const body = document.body;
  const prevOverflow = root.style.overflow;
  const prevPad = body.style.paddingRight;
  const sbw = window.innerWidth - root.clientWidth;
  root.style.overflow = "hidden";
  if (sbw > 0) body.style.paddingRight = `${sbw}px`;
  return () => {
    root.style.overflow = prevOverflow;
    body.style.paddingRight = prevPad;
  };
}
