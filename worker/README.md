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

Run in order. Steps 1 to 4 are safe and reversible; the site keeps using
`workers.dev` until step 5.

0. **Prerequisites, checked DAYS ahead, not during the window:**
   - The `berrova.com` zone (Websites, with the DNS tab) appears in the SAME
     Cloudflare account that lists `berrova-checkout` under Workers & Pages.
     A Custom Domain or Route cannot cross accounts, and the dashboard fails
     quietly when it cannot comply. Do not improvise zone moves on cutover
     night; moving a zone means re-entering every DNS record by hand, and a
     mistake on the apex records takes the live store down.
   - The zone's proxy pipeline has never fronted checkout before (the apex is
     DNS-only to GitHub Pages; `workers.dev` bypasses the zone). Audit before
     cutover: Security > Bots (Bot Fight Mode OFF, or a skip rule for
     `http.host eq "checkout.berrova.com"`), WAF custom rules, Rate Limiting
     rules, and Rules > Redirect/Page Rules for wildcard host patterns that
     would catch a new subdomain. A challenge page returns text/html with no
     CORS header and surfaces in the cart as the browser's generic
     "Failed to fetch", per visitor, invisible in Worker logs.
   - In the zone's DNS tab, search for an existing `checkout` record. Record
     "none" or exactly what is there before overriding anything.
   - Do NOT query `checkout.berrova.com` in DNS before creating it. The zone's
     negative-cache TTL is 1800s, so a premature lookup poisons that resolver
     with NXDOMAIN for 30 minutes and makes a working setup look broken.
1. Add the custom domain (above). Do not change the repo yet.
2. Wait for the dashboard to show the domain ACTIVE (certificate issuance is
   asynchronous, up to ~15 minutes). If DNS still fails afterward, re-test
   from a resolver that never saw the name (`curl --doh-url` against a fresh
   provider) before concluding anything or deleting and re-adding.
3. Confirm the Worker answers on the new host, in TEST mode:

   ```
   # CORS preflight -> expect 204 + access-control-allow-origin: https://berrova.com
   curl -s -D- -o /dev/null -X OPTIONS \
     -H "Origin: https://berrova.com" \
     -H "Access-Control-Request-Method: POST" \
     https://checkout.berrova.com/create-checkout-session

   # Real session -> expect {"url":"https://checkout.stripe.com/c/pay/cs_test_..."}
   # ALSO check content-type: a challenge/HTML page here means the zone
   # pipeline (step 0) is intercepting, even with a 200.
   curl -s -D- -X POST https://checkout.berrova.com/create-checkout-session \
     -H "Origin: https://berrova.com" -H "Content-Type: application/json" \
     -d '{"items":[{"id":"shr-sample","qty":1,"mode":"payment"}]}'
   ```

   The session id MUST start with `cs_test_`. If it starts with `cs_live_`,
   stop: the Worker is on a live key and this is not a drill.
   Note curl passing is NECESSARY but not SUFFICIENT: curl is not subject to
   bot scoring or challenge logic. Only step 5 proves the path a customer uses.
4. Merge the branch that switches `VITE_CHECKOUT_ENDPOINT`. Pushing to `main`
   auto-deploys, so do not merge until step 3 passes.
5. Verify on the live site IN A REAL BROWSER: add an item, open DevTools >
   Network, click Checkout, and confirm the POST to `checkout.berrova.com`
   returns 200 with content-type `application/json` (an HTML response is a
   challenge page). Complete a test purchase with `4242 4242 4242 4242` and
   confirm the order row appears in the Airtable order log.
   Deploy-cache note: `/` is CDN-cached up to 600s, and each deploy renames
   the hashed bundle, so for ~10 minutes some visitors hold HTML referencing
   a bundle that no longer exists and see a blank page. Wait out the full 600s
   after the deploy before judging step 5, and never chain a cutover and a
   rollback inside the same 10-minute window.
6. Leave the `workers.dev` route ENABLED for at least 48 hours and until
   several real customer sessions have completed through the new host. The
   failure mode that motivated this migration announced itself days late,
   from the customer side. Disabling the old route is a cleanup step for next
   week, not cutover night.

**Rollback:** FIRST confirm the `workers.dev` route is still enabled in the
dashboard (re-enable it if not), THEN revert the one-line
`VITE_CHECKOUT_ENDPOINT` change and push. Honest timing: the revert queues
behind any in-flight deploy (Pages concurrency does not cancel), then runs
npm ci, a Chromium install, and the prerender, so budget 10 to 15 minutes,
not 2. The prerender exits nonzero if any route fails to render, which blocks
the artifact upload entirely; if that happens, re-run the workflow from the
Actions tab rather than pushing more commits. Rehearse the rollback once on a
no-op commit so the real number is measured, not guessed.

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
