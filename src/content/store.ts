// Store catalog. Single source of truth for SKUs and prices on the CLIENT.
// These same ids and amounts are mirrored server-side in worker/src/index.ts,
// which is the authority at charge time: the Worker rebuilds every Stripe line
// item from its own copy of this map and ignores any price the client sends.
// Prices are LOCKED (set by the founder, not fabricated). USD, in cents.
//
// House style: no em dashes. Use commas or " -- ".

export type Sku = {
  id: string;
  name: string;
  size: string;
  blurb: string;
  oneTimeCents: number;
  subscribeCents: number | null; // null = no subscription offered for this SKU
  // Optional supporting points rendered under the SKU. Every line here must be
  // true of the physical product. Nothing aspirational, nothing borrowed from
  // the corporate gifting lane (custom cards, co-branding) -- that is a
  // different, quote-based offer and does not describe this box.
  points?: string[];
};

export const CURRENCY = "usd";

export const CATALOG: Sku[] = [
  {
    id: "shr-8oz",
    name: "Strawberry Hill 8 oz",
    size: "8 oz",
    blurb: "The everyday bag. JACRA-certified Jamaica Blue Mountain, roasted to order.",
    oneTimeCents: 6800,
    subscribeCents: 5900,
  },
  {
    id: "shr-16oz",
    name: "Strawberry Hill 16 oz",
    size: "16 oz",
    blurb: "The full pour. The same coffee, more of it, at a better per-ounce price.",
    oneTimeCents: 12500,
    subscribeCents: 10900,
  },
  {
    id: "shr-giftbox",
    name: "Strawberry Hill Gift Box (3 x 2 oz)",
    size: "3 x 2 oz",
    blurb: "Three sealed 2 oz packages in a boxed set. A one-time gift, no commitment.",
    oneTimeCents: 7900,
    subscribeCents: null,
    // Kyle's ruling, 2026-09-08: THE PRESENTATION IS THE PRODUCT. The box and
    // the sealed packages are what the buyer is paying for, so the copy sells
    // gifting rather than apologising for the per-ounce number. An earlier
    // draft led with "the same lot as the full bags", which invites exactly
    // the comparison it was trying to survive -- and the proof gate could not
    // check lot parity against any source of truth in this repo, so that line
    // is gone on both counts.
    //
    // VERIFIED-ONLY. Each line restates something already on the site or
    // implied by the SKU definition itself:
    //   boxed set, 3 x 2 oz              -> this SKU's own size field
    //
    // POINT 1 WAS CORRECTED ON 2026-09-08. It read "not a bag in a mailer",
    // which is a claim about how the OTHER SKUs ship, and grep for "mailer"
    // across src/ returned exactly one hit: that sentence itself. Nothing in
    // this repo says the full bags ship in a mailer. It was an invented
    // contrast sitting inside a block headed VERIFIED-ONLY, which is the
    // worst place for one, and the proof gate caught it. The rewrite keeps
    // Kyle's ruling (the presentation is the product) and says only what the
    // SKU itself establishes.
    //   JACRA-certified, roasted to order, sealed at origin -> pages/Story.tsx
    //   one-time, no subscription        -> subscribeCents: null, below
    //
    // "TINS" WAS WITHDRAWN ON 2026-09-13, and nothing replaced it, because we
    // do not know the container. The one place in the vault that records the
    // 2 oz format had cited THIS PAGE as its evidence:
    //
    //   Strawberry Hill Reserve/08-PRODUCTS-OFFERS/brand-assets/label-designs-v1.md
    //
    // That file USED TO say the 2 oz "may not be a pouch at all", and its stated
    // reason was that the live site described tins. So the site was the source
    // for the vault and the vault was the source for the site, and no primary
    // source existed on either side. BOTH ENDS WERE CORRECTED THE SAME DAY: that
    // paragraph no longer ASSERTS the container. It is headed "The 2 oz format
    // is unknown, and the evidence that said otherwise was circular", and it
    // quotes its own old wording as withdrawn.
    //
    // So the words are still on that page and you WILL find them if you grep -
    // as a record of what was retracted, not as a claim. Read the heading before
    // the quote. This comment said the opposite until the proof gate grepped the
    // file and found the sentence it had just declared absent.
    //
    // The only 2 oz line Island Coffees has ever priced to us names no
    // container, and whether a 2 oz whole-bean package exists at all is
    // supplier question 17b, still unanswered.
    //
    // Note what did NOT change: "sealed" stays, because sealing at origin is
    // established independently of the container. Only the container word went.
    //
    // "Packages" is deliberately vague and stays vague until Kenric answers.
    // Do not restore "tins", and do not substitute "pouches", on the strength
    // of this page having said it before. Same rule as the grind comment in
    // src/pages/Product.tsx: stop claiming, do not counter-claim.
    //
    // NOT WRITTEN, because nobody has confirmed them and the no-fabrication
    // rule covers product claims: an included card or note, reusable or
    // branded packaging, ship-direct-to-recipient, gift wrapping, or three
    // DIFFERENT origins in the box. Any of those would carry the price on its
    // own. Confirm first, then add.
    points: [
      "A boxed set of three, ready to hand over as it is. What arrives is the gift.",
      "Three individually sealed 2 oz packages. Each one opens fresh, so it keeps giving after the first pour.",
      "JACRA-certified Jamaica Blue Mountain, roasted to order and sealed at origin. The certification does the explaining for you.",
      "One-time. No subscription, no auto-renew, nothing for them to cancel later.",
    ],
  },
  {
    id: "shr-sample",
    name: "Strawberry Hill 2 oz sample",
    size: "2 oz",
    blurb: "The low-risk way to taste it first. One-time sample size.",
    oneTimeCents: 1400,
    subscribeCents: null,
  },
];

const BY_ID: Record<string, Sku> = Object.fromEntries(CATALOG.map((s) => [s.id, s]));

export function getSku(id: string): Sku | undefined {
  return BY_ID[id];
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  // Show whole dollars without trailing .00, otherwise two decimals.
  return Number.isInteger(dollars)
    ? `$${dollars}`
    : `$${dollars.toFixed(2)}`;
}

// FTC Mail Order Rule ship-window copy. Shown before payment, on the cart and the
// order-success page. Kept verbatim so legal review has one place to check.
//
// Widened from "about 2 to 3 weeks" to 8 weeks on 2026-08-05. The rule requires a
// reasonable basis for whatever time we state, and we do not have one for 2 to 3
// weeks: the supplier's lead time is 4 to 6 weeks, payment is wired before the
// batch is produced, and packing and outbound shipping sit on top of that. The
// honest chain runs 5 to 7 weeks from charge to dispatch, so 8 is the number we
// can actually stand behind. Do not shorten this without a supplier lead time in
// writing, or without inventory already landed in Lewisville.
export const SHIP_WINDOW =
  "Roasted and packaged to order at origin. Because each batch is produced in Jamaica after you order, we ship within 8 weeks. The window is shown before you pay, and if we cannot meet it you can cancel for a full refund.";
