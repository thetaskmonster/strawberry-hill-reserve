# CLAUDE.md — Strawberry Hill Reserve cinematic site

Operating contract for this repo. Read before editing.

## What this is
A cinematic, scroll-driven website for the {{BRAND}} coffee house; **Strawberry Hill Reserve** is the hero Jamaica Blue Mountain line, not the whole company. Technique reference is RÖSTWERK (technique and quality bar only, never its content, brand, or model).

## Stack
- React + Vite + TypeScript + Tailwind. GSAP + ScrollTrigger for motion. **No WebGL, no Three.js** (imagery is the trust signal, same call as the snow plow build).
- Deploy target: Cloudflare Pages or Vercel.
- Tokens: `src/styles/tokens.css` (single source of truth). Components use semantic tokens, never raw hex/px/ms.

## The split (deliberate)
- **Cinema:** homepage hero + the seed-to-cup story/authenticity page. Full scroll-film treatment.
- **Clean commerce:** product pages, gifting inquiry, subscription management, checkout. Fast, conversion-first, light motion only. A buyer must never scroll through a film to act.

## Honesty line (hard rule, the brand's moat)
- Generic coffee craft may be shown as generic licensed stock. **Never** caption, label, or alt-text a stock clip as a specific named claim (our lot, the estate, our 2026 harvest, a named farm). Specific-provenance moments use a labeled placeholder frame that real footage fills later.
- Proof contract: every quantity is a token — `{{JACRA_CERT_NO}}`, `{{ROAST_DATE}}`, `{{DROP_UNITS_REMAINING}}`, `{{SUBSCRIBER_COUNT}}`. A visible token is correct; an invented number fails.
- `{{BRAND}}` until the house-brand name is locked. No testimonials/ratings/review counts unless real. Brand mark, logo, real product shots are labeled placeholders until supplied.
- Do not generate images or video. Source only genuinely free-license stock (Coverr / Mixkit / Pexels), honesty line applies.

## Motion rules
- Scrub the money shots (process-film crossfades, one hero frame-scrub, hero parallax, marquee). Fade everything else (headline mask-in, card reveals). Marquee loops continuously.
- `prefers-reduced-motion`: scrubs collapse to poster/final state, fades become instant, marquee stops, scrub-video shows its poster.
- Mobile (<= 480px): if a scrub is too heavy, fall back to a poster image or a muted autoplay loop. No jank, no battery drain.

## Accessibility (core promise, WCAG 2.1 AA)
Semantic HTML, headings in order, keyboard navigable end to end, visible focus (`--focus`), labeled controls, 4.5:1 on body text. Kinetic type must pass contrast too.

## Type + palette (summary; full spec in docs/design-system.md)
- Display: **Anton** (condensed brutalist, UPPERCASE + large only, never body). UI sans: **Inter**. Signature wordmark only: **Great Vibes**.
- Monochrome + platinum: `--bg #0a0a0a`, `--fg #f2f0ec`, `--fg-muted #a8a49c`, `--accent #c7ccd1` (platinum, no gold/champagne).

## Phase status
- [x] Phase 1 — identity + tokens (this doc, tokens.css, design-system.md).
- [x] Phase 2 — structure (semantic scaffold, copy in `src/content/site.ts`, token wiring).
- [x] Phase 3 — the film (hero, scroll-scrub seed-to-cup, marquees, alpha reveal).
      **Pins deferred:** no ScrollTrigger `pin:` is used anywhere; the beats are
      full-height sections instead. Revisit only if the scroll story needs it.
      The one scroll-held beat (`CherryAnatomy` on `/story`) uses CSS
      `position: sticky` over a tall track, which is not a pin and keeps that
      decision intact. Its sticky box must stay exactly `h-screen` — a taller box
      releases before the scrub finishes.
- [x] Phase 4 — commerce (product, gifting, sub toggle, token scarcity, origin
      states, Stripe checkout via Cloudflare Worker, Stripe -> Airtable logging).
- [x] Phase 5 — verify. Real Chromium at 375/768/1440 across `/`, `/story`,
      `/reserve`, `/gifting`, `/wholesale`, `/faq`: 0 console errors, 0 page
      errors, 0 axe WCAG 2.1 A/AA violations, no horizontal overflow, heading
      order clean. (Media `ERR_ABORTED` entries are the browser cancelling
      paused/offscreen video fetches, not failures — the files serve 206.)
- [x] Phase 6 — ship-ready. Lighthouse a11y/best-practices/SEO **100** on every
      target. Perf: desktop `/` 99, mobile `/` 85, mobile `/reserve` 74 (LCP
      4.7s; main lever is code-splitting the 328 KB bundle, ~450ms of unused JS).
      Secrets scan clean (only placeholder keys in `.env.example` /
      `worker/.dev.vars.example`). No fabricated proof: no ratings, review
      counts, or testimonials; the one quantity (200 bags) is a real launch
      parameter documented at the top of `src/content/site.ts`.

### Known open items
- ~1.5 MB of orphaned video ships in `public/assets/video/` (`fire.*`,
  `04-pour.*`, `mountain.*`, `harvest.mp4`) — referenced nowhere in `src/`.
- Mobile perf on `/reserve` is the weakest score; no code-splitting yet.

## Safety
Original site is safe in the `second-brain` repo at `ridgeline-site/` on branch `claude/new-session-7i6xo3`. This is a separate repo and cannot touch it.
