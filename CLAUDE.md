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
- Display serif: **Playfair Display**. UI sans: **Inter**. Signature wordmark only: **Great Vibes**.
- Monochrome + platinum: `--bg #0a0a0a`, `--fg #f2f0ec`, `--fg-muted #a8a49c`, `--accent #c7ccd1` (platinum, no gold/champagne).

## Phase status
- [x] Phase 1 — identity + tokens (this doc, tokens.css, design-system.md). **At GATE 1.**
- [ ] Phase 2 — structure (semantic scaffold, placeholder copy, token wiring)
- [ ] Phase 3 — the film (hero, scroll-scrub seed-to-cup, pins, marquees, alpha reveal)
- [ ] Phase 4 — commerce (product, gifting, sub toggle, token scarcity, origin states)
- [ ] Phase 5 — verify (real browser, 375/768/1440, console, a11y, perf)
- [ ] Phase 6 — ship-ready (Lighthouse, secrets scan, no fabricated proof)

## Safety
Original site is safe in the `second-brain` repo at `ridgeline-site/` on branch `claude/new-session-7i6xo3`. This is a separate repo and cannot touch it.
