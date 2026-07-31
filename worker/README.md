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

4. Set the checkout guard token. This is a second secret, unrelated to Stripe:
   a shared token the website must send on every checkout request. Pick any
   long random string and store it the same way:

   ```
   npx wrangler secret put CHECKOUT_GUARD_TOKEN
   ```

   Then put the identical value in the website's `VITE_CHECKOUT_GUARD_TOKEN`
   (see the repo root `.env.example`) and rebuild/redeploy the website. Never
   put this value in `wrangler.toml` under `[vars]`, and never commit it.

5. Set the site origin. Open `wrangler.toml` and confirm `SITE_ORIGIN` is your
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

1. Copy `.dev.vars.example` to `.dev.vars` and put a TEST key in it, plus any
   value for `CHECKOUT_GUARD_TOKEN`. `.dev.vars` is git-ignored, so it never
   gets committed.
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

## Tests

```
cd worker
npm install
npx vitest run
```

`src/index.test.ts` imports the real exported `fetch` handler and invokes it
with actual `Request` objects (Node 22 provides global `Request`/`Response`/
`fetch`), so the tests exercise the same code path that runs in production.
Only the outbound call to `https://api.stripe.com` is mocked (via a stubbed
`global.fetch`); no network call and no real Stripe key are used.

## Security notes

Two gates protect `/create-checkout-session`, and they are not equally strong:

- **Origin check (hygiene, not the real gate).** The Worker only accepts POST
  requests whose `Origin` header is present AND matches `SITE_ORIGIN`; missing
  or mismatched Origin gets a 403. This only constrains browsers, which set
  `Origin` themselves and refuse to let JS override it. Any non-browser client
  (curl, a bot, a script) can set `Origin` to whatever it wants, or omit it,
  and there is nothing server-side that can tell the difference. Treat this as
  basic hygiene against accidental cross-site calls, not as access control.
- **Guard token (the real gate).** Every POST must also carry a matching
  `X-Berrova-Guard` header, compared against the `CHECKOUT_GUARD_TOKEN` secret
  with a constant-time comparison (see `timingSafeEqual` / `guardTokenValid`
  in `src/index.ts`). Missing or wrong token gets a 403, checked before the
  cart body is even read. This is what actually stands between the endpoint
  and a bot spamming Stripe TEST checkout session creation. It is still not
  strong auth: the token the website sends lives in `VITE_CHECKOUT_GUARD_TOKEN`,
  which ships in the site's public JS bundle like every other `VITE_` value,
  so anyone who reads the bundle can read it too. It raises the bar above
  blind/naive scripts hitting the known Worker URL; it does not stop a
  motivated attacker willing to inspect the bundle. `OPTIONS` preflight
  requests are exempt from this check (see the comment in `src/index.ts`):
  browsers send preflight without the custom header present by design, and
  preflight grants no access on its own.
- The secret key lives only in Cloudflare (via `wrangler secret put`) or in the
  local `.dev.vars` file. It is never in `wrangler.toml`, never in git, and never
  sent back to the browser. The same is true of `CHECKOUT_GUARD_TOKEN`: set it
  with `wrangler secret put CHECKOUT_GUARD_TOKEN`, never in `wrangler.toml`
  `[vars]` (those values are plaintext in the file and in deploy output).
- Prices are taken from the Worker's own list, so a tampered browser cannot
  change what it is charged.
- Neither gate replaces real rate limiting. If the guard token leaks (or the
  bundle is read) and abuse resumes, the next step is a Cloudflare-side rate
  limit or WAF rule, which is out of scope for this change because it is new
  paid infrastructure.
