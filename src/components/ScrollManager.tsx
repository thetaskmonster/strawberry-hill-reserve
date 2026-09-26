import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router does not scroll on its own. Before this existed, "Origins" in
// the header on every page updated the hash and moved nothing (measured
// 2026-09-07: target 3651px away, page did not move), and /gifting#inquiry
// landed 697px short. Two behaviours, both keyed on the location:
//   - a hash: scroll to that element, retrying on a short timer because the
//     target page may still be mounting when the location changes;
//   - no hash: a new pathname starts at the top, the way a new page should.
// Both jumps are "instant" on purpose. global.css sets `scroll-behavior:
// smooth` on <html>, and "auto" here would inherit that and animate the jump.
// Measured 2026-09-25 in the desktop app's browser pane: the animated scroll
// never moved the page (scrollY stayed 0), while the instant jump landed
// #inquiry at exactly 0px from the top. An anchor is a jump, not a glide, and
// prefers-reduced-motion users get the same answer either way.
const ATTEMPTS = 40;
const RETRY_MS = 50;
const JUMP: ScrollBehavior = "instant";
const RE_ALIGN_MS = [250, 900];

export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: JUMP });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let attempt = 0;
    const timers: number[] = [];
    const align = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start", behavior: JUMP });
      return Boolean(el);
    };
    // Timers, NOT requestAnimationFrame. A hidden tab pauses animation frames
    // entirely, so an rAF retry loop never fires for a page opened in the
    // background, or in the desktop app's browser pane while it is hidden.
    // Measured 2026-09-26: the effect ran (scroll restoration flipped to
    // manual) and not one jump was attempted. Timers still run when hidden,
    // throttled, so the jump lands before the tab is ever looked at.
    const tryScroll = () => {
      if (align()) {
        // A direct load of /gifting#inquiry measured 719px short after the
        // first jump: fonts, media and the reveal animations above the target
        // finish laying out after the element exists, and the browser's own
        // fragment scroll on `load` can land on the pre-layout position too.
        // Re-align twice more, then leave the user's scroll alone.
        for (const ms of RE_ALIGN_MS) timers.push(window.setTimeout(align, ms));
        return;
      }
      if (++attempt < ATTEMPTS) timers.push(window.setTimeout(tryScroll, RETRY_MS));
    };
    // On a DIRECT load with a hash, the browser performs its own fragment
    // scroll and scroll restoration when `load` fires, which on a slow load
    // (the dev server fetches every module separately) comes AFTER every
    // retry above and put the page back at 0. Own that moment: restoration
    // goes manual while a hash is in play, and the jump is repeated on `load`.
    const onLoad = () => {
      align();
      timers.push(window.setTimeout(align, 100));
    };
    const restoration = window.history.scrollRestoration;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (document.readyState !== "complete") window.addEventListener("load", onLoad, { once: true });
    timers.push(window.setTimeout(tryScroll, 0));
    return () => {
      window.removeEventListener("load", onLoad);
      for (const t of timers) window.clearTimeout(t);
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = restoration;
    };
  }, [pathname, hash]);

  return null;
}
