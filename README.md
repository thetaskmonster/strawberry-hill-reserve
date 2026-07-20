# Strawberry Hill Reserve — cinematic rebuild

Scroll-driven cinematic site for the {{BRAND}} coffee house, hero line Strawberry Hill Reserve.
Technique reference: RÖSTWERK (technique + quality bar only, not content/brand/model).

## Stack
React + Vite + TypeScript + Tailwind, GSAP + ScrollTrigger. No WebGL/Three.js.
Cinema on the homepage hero and seed-to-cup story; clean fast commerce pages.

## Develop / build
    npm install
    npm run dev       # local dev
    npm run build     # tsc + vite build -> dist/
    npm run preview   # serve dist with SPA fallback

Deploy target: Cloudflare Pages or Vercel. SPA fallback is configured
(`public/_redirects`, `vercel.json`). Build command `npm run build`, output `dist`.

## Fill before launch (proof contract, honesty line)
These render as visible placeholder tokens today. Replace at the source noted:
- `{{BRAND}}` — house brand name (src/content/site.ts).
- `{{INQUIRY_EMAIL}}` — gifting inquiry recipient (src/pages/Gifting.tsx).
- `{{JACRA_CERT_NO}}`, `{{ROAST_DATE}}`, `{{LOT_NO}}` — certification / batch, render live from source.
- `{{DROP_UNITS_REMAINING}}`, `{{NEXT_DROP_COUNTDOWN}}`, `{{DROP_DATE}}` — Reserve scarcity, wire to inventory.
- Real product shots and the JACRA / JBM certification mark — currently labeled placeholders.
- Film clips in `public/assets/video/` are generic licensed stock (Mixkit). Swap per beat with
  your own footage when shot. NEVER caption a stock clip as a specific named claim (our lot, the
  estate, our harvest). Generic craft shown as generic craft only.

## Honesty line (hard rule)
Every quantity is a token; an invented number fails review. No testimonials/ratings/review counts
unless real. Brand mark, logo, product shots are labeled placeholders until supplied.
