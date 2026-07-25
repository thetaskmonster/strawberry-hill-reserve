# Berrova checkout Worker

A tiny Cloudflare Worker that creates Stripe Checkout Sessions for the Berrova
store. The website posts a validated cart to it, the Worker builds the Stripe
line items from its own price list, and it returns a URL to send the shopper to.

The Worker never trusts prices from the browser. It has its own copy of the
price list in `src/index.ts` (the `PRICE_MAP`) and that copy wins. If you change
a price, change it in both `src/index.ts` here and `src/content/store.ts` in the
website.

## What you need first

- A Stripe account, with the payment methods you want turned on in the Stripe
  Dashboard (cards, and optionally Affirm and Afterpay). The Worker does not set
  payment methods, so whatever is enabled in the Dashboard is what shoppers see.
- Your Stripe secret key. Start with the TEST key (`sk_test_...`) while you try
  it out, then switch to the LIVE key (`sk_live_...`) when you go live.
- Node installed on your machine.

## One-time setup

1. Install the Cloudflare command line tool (wrangler):

   ```
   cd worker
   npm install
   ```

2. Log in to Cloudflare. This opens a browser window:

   ```
   npx wrangler login
   ```

3. Set your Stripe secret key. This stores it securely in Cloudflare, not in any
   file. It will ask you to paste the value:

   ```
   npx wrangler secret put STRIPE_SECRET_KEY
   ```

   Paste your `sk_test_...` (or `sk_live_...`) key and press Enter.

4. Set the site origin. Open `wrangler.toml` and confirm `SITE_ORIGIN` is your
   real site, `https://berrova.com`, with no trailing slash. This controls which
   site is allowed to call the Worker and where shoppers return after paying.

## Deploy

```
npx wrangler deploy
```

When it finishes it prints a URL, something like
`https://berrova-checkout.YOUR-SUBDOMAIN.workers.dev`.

The website needs the full endpoint URL, which is that address followed by
`/create-checkout-session`. For example:

```
https://berrova-checkout.YOUR-SUBDOMAIN.workers.dev/create-checkout-session
```

Put that value in the website's `VITE_CHECKOUT_ENDPOINT` (see the repo root
`.env.example`), then rebuild and redeploy the website. Until that value is set,
the Checkout and Subscribe buttons stay disabled on purpose, so nothing looks
broken before the keys are in place.

## Try it locally

1. Copy `.dev.vars.example` to `.dev.vars` and put a TEST key in it. `.dev.vars`
   is git-ignored, so it never gets committed.
2. Run:

   ```
   npm run dev
   ```

3. The Worker runs at a local address wrangler prints. Point the website's
   `VITE_CHECKOUT_ENDPOINT` at `http://localhost:8787/create-checkout-session`
   and set `SITE_ORIGIN` in `.dev.vars` to your local site origin
   (for the Vite dev server that is `http://localhost:5173`).

## How it decides one-time versus subscription

The website sends a list of items, each with a `mode`:

- A normal cart sends every item with `mode: "payment"`. The Worker makes a
  one-time payment session.
- A "Subscribe & save" button sends exactly one item with
  `mode: "subscription"`. The Worker makes a monthly subscription session.

Stripe does not allow mixing a one-time payment and a subscription in the same
checkout, which is why subscribe is always a single item and skips the cart.

## Security notes

- The secret key lives only in Cloudflare (via `wrangler secret put`) or in the
  local `.dev.vars` file. It is never in `wrangler.toml`, never in git, and never
  sent back to the browser.
- The Worker only accepts POST requests from `SITE_ORIGIN`.
- Prices are taken from the Worker's own list, so a tampered browser cannot
  change what it is charged.
