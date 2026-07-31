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

## Custom domain (REQUIRED before real customers)

**Do not ship a checkout that lives on `*.workers.dev`.** Consumer security
suites flag free-hosting TLDs. On 2026-07-31 Bitdefender blocked the
`workers.dev` fetch from the live site: the cart showed only the browser's
generic "Failed to fetch" while the Worker itself was healthy and returning
correct CORS headers. That failure mode leaves no server-side trace and is
indistinguishable from a broken store to the customer.

The fix is to serve the Worker from a subdomain of the site's own domain, so it
inherits that domain's reputation.

1. Cloudflare dashboard, Workers & Pages, `berrova-checkout`, Settings,
   Domains & Routes, Add, Custom Domain.
2. Enter `checkout.berrova.com`. The `berrova.com` zone is already on Cloudflare
   DNS (`cesar`/`teresa.ns.cloudflare.com`), so Cloudflare creates the DNS
   record and provisions the certificate automatically. Allow a few minutes.
3. Verify before switching the site over (checklist below).
4. After the site is switched and verified, disable the `workers.dev` route on
   the same screen, so exactly one endpoint exists.

`SITE_ORIGIN` does NOT change. It is the browser origin allowed to call the
Worker (`https://berrova.com`), not the Worker's own hostname.

The website needs the full endpoint URL, which is the custom domain followed by
`/create-checkout-session`:

```
https://checkout.berrova.com/create-checkout-session
```

That value lives in `VITE_CHECKOUT_ENDPOINT` in
`.github/workflows/deploy-pages.yml` (and the repo root `.env.example` for local
dev). Until it is set, the Checkout and Subscribe buttons stay disabled on
purpose, so nothing looks broken before the keys are in place.

### Cutover checklist

Run in order. Steps 1 to 3 are safe and reversible; the site keeps using
`workers.dev` until step 4.

1. Add the custom domain (above). Do not change the repo yet.
2. Confirm `checkout.berrova.com` resolves to Cloudflare IPs.
3. Confirm the Worker answers on the new host, in TEST mode:

   ```
   # CORS preflight -> expect 204 + access-control-allow-origin: https://berrova.com
   curl -s -D- -o /dev/null -X OPTIONS \
     -H "Origin: https://berrova.com" \
     -H "Access-Control-Request-Method: POST" \
     https://checkout.berrova.com/create-checkout-session

   # Real session -> expect {"url":"https://checkout.stripe.com/c/pay/cs_test_..."}
   curl -s -X POST https://checkout.berrova.com/create-checkout-session \
     -H "Origin: https://berrova.com" -H "Content-Type: application/json" \
     -d '{"items":[{"id":"shr-sample","qty":1,"mode":"payment"}]}'
   ```

   The session id MUST start with `cs_test_`. If it starts with `cs_live_`,
   stop: the Worker is on a live key and this is not a drill.
4. Merge the branch that switches `VITE_CHECKOUT_ENDPOINT`. Pushing to `main`
   auto-deploys, so do not merge until step 3 passes.
5. Verify on the live site: add an item, click Checkout, land on Stripe, and
   complete a test purchase with `4242 4242 4242 4242`. Confirm the order row
   appears in the Airtable order log.
6. Disable the `workers.dev` route.

**Rollback:** revert the one-line `VITE_CHECKOUT_ENDPOINT` change and push. The
site redeploys against `workers.dev` in about two minutes. Keep that route
enabled until step 5 passes, so rollback stays available.

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
