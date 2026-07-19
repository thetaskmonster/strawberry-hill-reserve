# Design system (Phase 1) — Strawberry Hill Reserve cinematic rebuild

Flag: CORVO-77. Proposal for GATE 1. Monochrome + platinum, cinematic-dark, brutalist-editorial headlines over honest stock craft imagery. Aligned to the established brand (black / white / platinum, no gold) so the rebuild reads as the same brand elevated, not a reboot.

## 1. Typefaces (two, plus a signature accent)

| Role | Family | Fallback stack | Why (two sentences) |
|---|---|---|---|
| Display / kinetic headlines | **Playfair Display** | Georgia, "Times New Roman", serif | A high-contrast transitional serif carries cinematic, editorial gravitas at the oversized single-word scale (Raw. Roasted. Ground. Poured.) that the RÖSTWERK technique demands. It also continues the established Strawberry Hill identity, so the rebuild looks like the brand growing up, not a different company. |
| Text / UI / commerce | **Inter** | system-ui, -apple-system, "Segoe UI", Roboto, sans-serif | A neutral grotesque stays perfectly legible from fine print to buttons, which is what closes sales on the clean commerce pages. It recedes so the photography and the serif carry all the brand personality. |
| Signature wordmark (accent, used sparingly) | **Great Vibes** | "Snell Roundhand", cursive | Reserved for the "Strawberry Hill" signature exactly as it appears on the physical bag, so the digital brand and the real product match. Never used for body or UI, so it stays a mark, not a font. |

Two working typefaces total (Playfair, Inter); the script is a brand-signature asset used only for the wordmark.

## 2. Palette (hex + semantic tokens)

Raw values map to semantic tokens; components use the semantic token, never a raw hex.

| Semantic | Value | Use | Contrast note |
|---|---|---|---|
| `--bg` | `#0a0a0a` | base background | — |
| `--bg-film` | `#050505` | full-bleed film sections | deepest black for video compositing |
| `--bg-warm` | `#141210` | coffee-warmth panels | warm near-black |
| `--bg-elev` | `#171a1d` | cards, elevated surfaces | cool slate |
| `--fg` | `#f2f0ec` | primary text | ~18:1 on `--bg`, AAA |
| `--fg-muted` | `#a8a49c` | secondary text | ~7:1 on `--bg`, passes AA body (4.5:1) |
| `--accent` | `#c7ccd1` | platinum accent, rules, small marks | the brand metal, cool not warm (no gold, no champagne) |
| `--accent-strong` | `#e8ebee` | bright platinum, emphasis | high contrast on dark |
| `--border` / `--border-strong` | rgba cream .12 / .24 | hairlines | — |
| `--focus` | `#8fd0ff` | keyboard focus ring | high-contrast on both dark and light |
| `--danger` | `#e6b0a6` | form errors | readable on dark, not alarmist red |

Justification: the brand's whole moat is provable authenticity, so the palette stays disciplined monochrome with a single cool-metal accent. Warm near-blacks in the film sections give coffee warmth without introducing gold, which the brand explicitly forbids.

## 3. Spacing, radius, measure

- **Spacing:** 8px rhythm, `--space-1` (.25rem) through `--space-11` (12rem), plus a fluid `--gutter` for page edges and `--space-9/10/11` for cinematic section breathing room. Big vertical rhythm is what makes a film feel like a film.
- **Radius:** deliberately sharp. `--r-sm` 2px, `--r` 4px, `--r-lg` 8px. A brutalist-editorial brand reads as crafted and serious with minimal rounding; pills are reserved for a single utility (chips).
- **Measure:** `--measure` 64ch caps reading width so body copy never runs uncomfortably wide on the cinematic full-bleed layouts.

## 4. Motion language (what scrubs vs what fades)

Durations: `--dur-fast` 200ms (UI), `--dur` 400ms (reveals), `--dur-slow` 900ms, `--dur-cinematic` 1200ms (hero, signature). Easings: `--ease-out` for reveals that rise and settle, `--ease-cinematic` for long filmic moves.

| Behaviour | Elements | Technique |
|---|---|---|
| **Scrub** (scroll-linked, progress-driven) | process-film crossfades (source→fire→grind→pour), the ONE hero frame-scrub "impact" moment, hero media parallax, marquee position | GSAP ScrollTrigger `scrub`; video via `currentTime` for the single scrub moment, opacity/z for crossfades |
| **Fade / one-shot** (triggered once, not tied to scroll position) | headline mask-in, card and section reveals, nav sticky state | ScrollTrigger `toggleActions`, transform + opacity |
| **Continuous** | marquee tickers | CSS/GSAP loop, duplicated track |
| **Reduced motion** | everything | scrubs collapse to the final/poster state, fades become instant or a 200ms opacity, marquee stops, scrub-video shows its poster. Durations tokened to 1ms under `prefers-reduced-motion` |

Justification: cinema comes from a few decisive scroll-linked moments, not from animating everything, which is also how we protect the mobile performance budget. Scrub the money shots, fade the rest, and give reduced-motion users a clean static cut of the same story.

## 5. The honesty layer (baked into the system)

- Every quantity renders from a token: `{{JACRA_CERT_NO}}`, `{{ROAST_DATE}}`, `{{DROP_UNITS_REMAINING}}`, `{{SUBSCRIBER_COUNT}}`. A visible token is correct; an invented number fails review.
- `{{BRAND}}` token for the house brand name until it is locked.
- Stock craft imagery is shown as generic craft. No stock clip is ever captioned/alt-texted as a specific named claim (our lot, the estate, our harvest, a named farm). Specific-provenance slots use a labeled placeholder frame.
- No testimonials, star ratings, or review counts unless real ones are supplied. Brand mark, logo, and real product shots are labeled placeholders until supplied.
