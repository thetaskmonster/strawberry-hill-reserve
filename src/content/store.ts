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
};

export const CURRENCY = "usd";

export const CATALOG: Sku[] = [
  {
    id: "shr-8oz",
    name: "Strawberry Hill Reserve 8 oz",
    size: "8 oz",
    blurb: "The everyday bag. Certified Jamaica Blue Mountain, roasted to order.",
    oneTimeCents: 6800,
    subscribeCents: 5900,
  },
  {
    id: "shr-16oz",
    name: "Strawberry Hill Reserve 16 oz",
    size: "16 oz",
    blurb: "The full pour. Same lot, more of it, at a better per-ounce price.",
    oneTimeCents: 12500,
    subscribeCents: 10900,
  },
  {
    id: "shr-giftbox",
    name: "Reserve Gift Box (3 x 2 oz)",
    size: "3 x 2 oz",
    blurb: "Three sealed 2 oz tins in a boxed set. A one-time gift, no commitment.",
    oneTimeCents: 7900,
    subscribeCents: null,
  },
  {
    id: "shr-sample",
    name: "Strawberry Hill Reserve 2 oz sample",
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
export const SHIP_WINDOW =
  "Fresh-to-order origin batch. Ships in about 2 to 3 weeks; first orders of a drop may run a little longer. The window is shown before you pay, and if we cannot meet it you can have a refund.";
