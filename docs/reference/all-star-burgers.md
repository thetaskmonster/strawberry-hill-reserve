# Reference teardown — "ALL STAR BURGERS" scroll site

**Source:** a 15.8s vertical screen-recording (Instagram reel, watermark
`@w.wearebrand`, caption "Claude Code can't do that 😮‍💨"). The site itself is an
Emergent preview build — the persistent bottom bar reads *"Frontend Preview Only.
Please wake servers to enable backend functionality"* and there is a *"Made with
Emergent"* badge bottom-right. Recorded off a 24" iMac in Chrome at roughly
1440–1600 CSS px wide.

**Method:** the video was decoded to 474 frames at 30fps, sampled every 0.4s, and
the monitor region was cropped and upscaled ~2.6× so the layout, type, and copy
could be read directly. The 11 stills in `all-star-burgers/` are the resulting
frame captures — every observation below comes from looking at them, not from
markup (no DOM was available; this is a screen recording, not a live URL).

> **Scope note, per CLAUDE.md.** This is filed the same way RÖSTWERK is: a
> **technique and quality reference only**. None of its content, brand, imagery,
> palette, or copy belongs in Strawberry Hill Reserve. What transfers is the
> structural grammar — full-bleed food frames, oversized condensed display type
> set against them, an anatomy/callout beat, and a marquee. What does not
> transfer: the orange accent (we are monochrome + platinum, no warm accent), the
> hard-sell price grid, and — critically — its habit of stating specific product
> facts over stock-looking frames.

---

## 1. Frames captured

| # | File | Beat |
|---|------|------|
| 01 | `01-hero-built-like-an-all-star.jpg` | Hero, headline + dual CTA |
| 02 | `02-smashed-to-order.jpg` | Right-aligned caption over floating stack |
| 03 | `03-anatomy-exploded-callouts.jpg` | Exploded burger with hairline callouts |
| 04 | `04-the-stack.jpg` | "THE STACK" — three-product still life |
| 05 | `05-game-day-combo.jpg` | Combo beat, text entering over image |
| 06 | `06-combo-full-bleed.jpg` | Same beat, image at full bleed |
| 07 | `07-overtime-shakes.jpg` | Left-aligned caption over the same box shot |
| 08 | `08-the-lineup-title.jpg` | Light section wiping up over the dark one |
| 09 | `09-lineup-burger-cards.jpg` | Three-up burger menu cards |
| 10 | `10-sides-shakes-cards.jpg` | Three-up sides/shakes cards + marquee below |
| 11 | `11-footer-marquee.jpg` | Ghosted marquee "CHAR • SMASH • SAUCE •" |

---

## 2. Structure — the scroll in order

1. **Sticky header** (light, ~64px): circular red roundel mark + `ALL STAR BURGERS`
   in small condensed uppercase, left. Right: `MENU  CONCEPT  LOCATION` in tiny
   tracked-out uppercase, then a solid orange **ORDER NOW** pill/rect button. The
   bar stays visible over both dark and light sections and does not invert — it
   is always the light bar.
2. **Hero.** Full-viewport photograph: a smash burger on white deli paper on dark
   wood, shot dark and edge-lit. Copy sits bottom-left over the image:
   a thin rule + eyebrow `— ALL STAR BURGERS`, then the headline
   **BUILT LIKE / AN ALL-STAR.** on two lines, then one line of body, then two
   buttons — filled orange `ORDER NOW` + outlined `VIEW MENU`.
3. **Smashed to order.** The burger deconstructs into a floating exploded stack;
   the caption block moves to the **right** edge — `SMASHED TO ORDER` plus a
   short description.
4. **Anatomy.** Same exploded stack, now centered on a near-white ground, with
   six hairline leader lines running right to tiny uppercase labels: *buttery
   toasted bun / signature sauce / caramelized onions / melted American cheese /
   juicy beef patty / toasted bun*. This is the single most distinctive beat on
   the page.
5. **THE STACK.** Light section. Heading left, three cut-out products laid across
   the width — fries in a black carton, the burger, an Oreo shake.
6. **GAME DAY COMBO.** Cuts back to dark: full-bleed photo of an open branded
   takeout box (burger, fries, two sauce cups, shake) on brushed steel. Caption
   right-aligned.
7. **OVERTIME SHAKES.** Same box photograph, caption now bottom-**left**. The
   left/right alternation across beats 3 → 6 → 7 is the page's main rhythm device.
8. **Closed-box shot** — the branded box lid, logo centered, `MADE FRESH. MADE
   BOLD.` set as a small tracked rule between two hairlines.
9. **THE LINEUP.** A light panel wipes up over the dark one; the title sits
   centered and low in that panel as it rises.
10. **Menu grid.** Two rows of three cards. Row 1: `FREE THROW SHOT BURGER`,
    `LAYUP BURGER`, `HOOK SHOT BURGER`. Row 2: `TIMEOUT FRIES`,
    `ALL-STAR LOADED FRIES`, `OVERTIME MILKSHAKES`. Each card = 16:9 photo, a
    two-digit index (`05`, `06`), a title in oversized condensed uppercase that
    wraps to two lines, one line of description, then a right-aligned price
    column (variants stacked: `$5.16 / $9.76`, `$5.99 / $5.99 / $5.99`) with a
    small outlined `ORDER NOW` button at the far right.
11. **Marquee footer.** Oversized ghosted display type, `CHAR • SMASH • SAUCE •`
    repeating, set in a very low-contrast tint of the background — a texture
    layer, not a readable line.

---

## 3. Type

- **One display face, everywhere.** A heavy condensed grotesque (Anton /
  Druk-Condensed family), UPPERCASE only, tracking near zero, line-height ~0.85 —
  the two-line headline stacks tight enough that the lines almost touch. Used for
  headlines, card titles, section titles, and the marquee. Never for body.
- **Titles are allowed to overflow.** Card titles wrap to a second line that
  crowds the description under it (`ALL-STAR LOADED / FRIES`, `OVERTIME /
  MILKSHAKES`) — the crowding is left in rather than the type being scaled down.
  Deliberate, but it is genuinely near the legibility line.
- **UI text** is a plain sans at small sizes: nav, eyebrows, callout labels, and
  the `MADE FRESH. MADE BOLD.` rule all use wide letter-spacing (~0.15–0.2em) at
  10–12px uppercase.
- **Prices** are set in the display face too, right-aligned, stacked one variant
  per line.
- **Body copy** is a single short line, never a paragraph. Every beat is
  headline + one sentence.

## 4. Color

| Role | Observed | Note |
|---|---|---|
| Dark ground | near-black `#0a0a0a`-ish | photographs carry the dark, not flat fills |
| Light ground | warm off-white `#f4f1ec`-ish | slightly warm, not pure white |
| Ink on light | near-black | |
| Accent | saturated orange `#f0641e`-ish | *only* on the CTA button and the header roundel |
| Brand red | `#c8102e`-ish | inside the photography (box, logo), not in the UI |
| Marquee ghost | ~6–8% ink on the light ground | |

Accent discipline is the lesson: exactly one accent, used only on the primary
action. Everything else is black, off-white, and photography.

## 5. Layout

- Full-bleed sections edge to edge; the only inset content is the card grid.
- Text over photography sits in the bottom third, alternating left/right edge.
- No cards, no shadows, no rounded corners anywhere except the CTA pill. Buttons
  are a filled rect and a 1px outlined rect.
- Hairlines do a lot of work: eyebrow rules, the callout leader lines, the rule
  around `MADE FRESH. MADE BOLD.`, the card dividers.
- The card grid is a plain three-column layout with generous gutters and a big
  empty band under the prices before the next row.

## 6. Motion (what the recording actually shows)

- **Scroll is not 1:1.** Sections move at different rates — the light `THE LINEUP`
  panel wipes *up over* the dark section above it while that section stays put
  (a classic overlap/cover transition, not a pinned scrub).
- **Text enters after its image.** In frames 05 → 06 the `GAME DAY COMBO` heading
  and its line are mid-transition — partially transparent and offset — while the
  photograph is already fully at bleed. Copy fades/translates in on the beat's
  entry, image is already there.
- **The exploded stack is the money shot** — the burger separating into layers
  across beats 2 → 3 → 4 is the one sequence the whole page is built around, and
  it reads as scroll-driven, not autoplay.
- **The marquee is a continuous horizontal loop**, ghosted, independent of scroll
  rate.
- No parallax on the hero that I can detect at this recording quality, no cursor
  effects, no WebGL. The perceived richness is entirely photography + type scale
  + section transitions.

## 7. What is worth stealing (technique only)

1. **The anatomy beat with hairline callouts.** *(Built — `src/components/CherryAnatomy.tsx`,
   on `/story`.)* The single best idea on the page,
   and it maps cleanly onto coffee — cherry, parchment, green, roast, grind, cup —
   as a scroll-scrubbed exploded diagram with labeled leader lines. This is
   exactly the kind of beat our seed-to-cup story wants, and it is honest: a
   diagram of a process is not a provenance claim.
2. **One accent, on the CTA only.** For us that is `--accent` (platinum) on the
   primary action and nothing else.
3. **Left/right caption alternation** across consecutive full-bleed beats as the
   rhythm device, instead of adding new layout types.
4. **Headline + exactly one sentence** per beat. Ruthless copy discipline.
5. **The ghosted oversized marquee as texture**, not as a readable line.
6. **Light panel wiping up over a dark section** as the transition into the
   commerce half — a clean way to signal "the film is over, this is the menu."

## 8. What must not be copied

- **The specific-claim-over-generic-image pattern.** Their callout labels
  ("buttery toasted bun") sit over what is plainly a stock/CGI composite. That is
  precisely the move our honesty line forbids: a specific named claim captioned
  onto footage that does not depict it. Our version of this beat uses labeled
  placeholder frames until real footage exists, and the labels describe the
  *process step*, never a named lot, estate, or harvest.
- **The orange accent and the red brand marks** — off-palette; we are monochrome
  + platinum with no warm accent.
- **Prices as the page's loudest typography.** Our split puts commerce on its own
  fast, light-motion pages; the film does not sell.
- **Title overflow crowding the description.** They ship it; we would fail our
  own contrast/legibility bar doing it.
- Anything implying volume, popularity, or ratings — there is none of that on
  their page either, which is worth noting.

## 9. Unknowns

The recording is 15.8s of a moving handheld shot at 720×1280, so the following
could not be established and should be treated as open rather than assumed: exact
hex values (sampled off a photographed screen under warm room light), the actual
font files, easing curves and durations, hover/focus states, the mobile
breakpoint behaviour, and everything below the marquee — the reel fades out
before a real footer, so the nav's `CONCEPT` and `LOCATION` destinations were
never shown.
