// Legal and policy pages. Copy lives here, not in the page components, so it
// is one greppable surface for the claims file and the proof gate.
//
// HONESTY LINE APPLIES. Every number on these pages is either a ruling
// recorded in the vault's decisions log or a figure fixed by a rule we cite:
//   8 weeks       ship window, ruled 2026-08-05
//   72 hours      pre-roast notice, ruled 2026-09-07 (a CONDITION of the roast cutoff)
//   30 days       first-bag guarantee from delivery, ruled 2026-09-07
//   7 working days / one billing cycle   16 CFR 435 refund timing
//   14 days       damaged-on-arrival window, carried from the 2026-09-07 draft
//   13            COPPA age floor
// Anything we could not ground stays out. Nothing here has been reviewed by
// counsel; Kyle ruled 2026-09-24 that a lawyer is engaged once sales start.
//
// The seller is named as the MOU names it: Berrova LLC, a Texas limited
// liability company in formation. The LLC is not filed yet. When it is, the
// "in formation" qualifier comes off here and nowhere else.

import { INQUIRY_EMAIL } from "./site";

export const LEGAL_UPDATED = "2026-09-26";
export const SELLER = "Berrova LLC, a Texas limited liability company in formation";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Paragraphs rendered after the bullets. */
  after?: string[];
};

export type LegalDoc = {
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

const CONTACT_LINE = `Write to us at ${INQUIRY_EMAIL}.`;

export const TERMS: LegalDoc = {
  path: "/terms",
  eyebrow: "Terms",
  title: "Terms of sale and site use.",
  intro:
    "The short version: you pay up front, we roast your coffee for you in Jamaica after you order, it takes up to 8 weeks, and you can cancel for a full refund any time before roasting begins. The long version is below.",
  sections: [
    {
      heading: "1. Who you are dealing with",
      paragraphs: [
        `These terms are an agreement between you and ${SELLER}, trading as Berrova.`,
        "Strawberry Hill is the name of a coffee we sell, as its producer already brands it. Berrova is the company. We are not affiliated with, endorsed by, or acting for any hotel, estate or business of a similar name.",
        "By ordering, you agree to these terms and to our Privacy Policy, Shipping Policy and Refunds and Returns Policy, which form part of them. If you do not agree, do not order.",
      ],
    },
    {
      heading: "2. What we sell, and how we describe it",
      paragraphs: [
        "We sell coffee. Where we describe a coffee as JACRA-certified, we mean it carries the certification of the Jamaica Agricultural Commodities Regulatory Authority, and we buy it through a dealer whose licences are on that authority's public registry. We do not print claims we cannot back.",
        "Prices are in US dollars and are shown before you pay. We can change prices at any time, but never for an order you have already placed.",
        "Photographs are representative. Roast, crop and harvest vary between batches, which is the nature of the product.",
      ],
    },
    {
      heading: "3. Placing an order",
      paragraphs: [
        "Your order is accepted when your payment completes and you receive a receipt.",
        "We may still cancel an order before it is roasted, and if we do we refund you in full. The reasons are limited: the coffee is unavailable, there was a pricing error on our side, we cannot ship to the address given, or we reasonably believe the order is fraudulent or for resale.",
        "Quantities are limited by the harvest. When a drop is gone it is gone.",
      ],
    },
    {
      heading: "4. Payment",
      paragraphs: [
        "Payment is taken in full at the time of order, including for coffee that has not yet been roasted. That is how we buy the coffee.",
        "Payments are processed by Stripe. We never see or store your card number.",
        "Where we are required to collect sales tax, it is shown at checkout before you pay.",
      ],
    },
    {
      heading: "5. Roasting to order, and when you can cancel",
      paragraphs: [
        "Your coffee is roasted for you after you order, at origin in Jamaica, then shipped to you direct. That has three consequences we want you to understand before you pay.",
      ],
      bullets: [
        "It takes up to 8 weeks. The window is stated before you pay and in our Shipping Policy.",
        "Before roasting begins, you can cancel for any reason and get everything back.",
        "After roasting begins, we cannot cancel the order, because the coffee was roasted for you and cannot be sold to anyone else.",
      ],
      after: [
        "We will not let that deadline pass without telling you. We email you at least 72 hours before roasting begins. If we fail to send that notice, you may cancel for a full refund even after roasting has started.",
        "If we miss our stated 8-week window, you can cancel for a full refund whatever stage the order has reached. We will contact you before the window expires and offer you that choice without you having to ask. Nothing in these terms limits that.",
      ],
    },
    {
      heading: "6. Subscriptions",
      bullets: [
        "A subscription charges you monthly, at the price shown when you subscribed, until you cancel.",
        "You can cancel at any time. There is no minimum term and no cancellation fee. Use the self-serve controls where your subscription offers them, or email us and we will do it.",
        "To stop a shipment that is already scheduled, cancel or skip before the roasting date for that shipment. We email you at least 72 hours before that date, the same notice a one-off order gets, and the same rule applies if the notice does not reach you.",
        "Cancelling stops future charges. It does not refund coffee already roasted or shipped.",
        "If we change a subscription price, we tell you before the next charge and you can cancel first.",
      ],
    },
    {
      heading: "7. Returns and refunds",
      paragraphs: ["Set out in full in our Refunds and Returns Policy, which forms part of these terms."],
    },
    {
      heading: "8. Corporate, wholesale and gifting",
      paragraphs: [
        "Bulk, corporate gifting and wholesale orders run on the terms of the individual quote, which take precedence over these terms where they differ. The consumer first-bag guarantee does not apply to them.",
      ],
    },
    {
      heading: "9. Using the site",
      paragraphs: [
        "The site, its text, photography and design are ours. You may not copy them for commercial use, scrape the site, or resell our coffee as your own without a written wholesale agreement.",
        "The site is provided as it is. We try to keep it accurate and available, and we do not promise it will be either at every moment.",
      ],
    },
    {
      heading: "10. Our liability",
      paragraphs: [
        "Nothing in these terms limits any liability that the law does not allow us to limit.",
        "Subject to that, our total liability for any order is limited to what you paid for that order, and we are not liable for indirect or consequential losses.",
      ],
    },
    {
      heading: "11. Things outside our control",
      paragraphs: [
        "We are not liable for delay or failure caused by events beyond our reasonable control, including crop failure, weather, port and customs delays, carrier failure and government action. Where such an event stops us shipping, section 5 applies and you can cancel for a full refund.",
      ],
    },
    {
      heading: "12. Changes to these terms",
      paragraphs: ["We may change these terms. The version that applies to your order is the one live when you placed it."],
    },
    {
      heading: "13. Governing law",
      paragraphs: ["These terms are governed by the law of the State of Texas."],
    },
    {
      heading: "14. Contact",
      paragraphs: [CONTACT_LINE],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  path: "/privacy",
  eyebrow: "Privacy",
  title: "Privacy policy.",
  intro:
    "The short version: we collect only what we need to send you coffee, we run no analytics and no advertising pixels, the site sets no cookies, and we do not sell or share your information. The long version is below, and it was written from what the site actually does.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [`${SELLER}, trading as Berrova. This policy covers berrova.com and any order you place through it.`, CONTACT_LINE],
    },
    {
      heading: "What we collect, and only when you give it to us",
      bullets: [
        "If you join the waitlist: your email address, and which page you joined from.",
        "If you place an order: your name, email address, shipping address, and what you ordered. Payment is taken by Stripe. We never see or store your card number.",
        "If you ask about corporate gifting or write to us: whatever you put in the form or the message.",
        "If you subscribe: the above, plus your subscription details, so we can send the right coffee at the right time.",
      ],
      after: ["That is the entire list. We do not buy data about you, we do not enrich what you give us, and we do not ask for anything we do not need to send you coffee."],
    },
    {
      heading: "What we do not do",
      bullets: [
        "No analytics. We do not run Google Analytics or any equivalent.",
        "No advertising pixels. No ad-network tags, nothing that reports your visit to a third party.",
        "No cookies. The site sets none.",
        "We do not sell or share your personal information, for money or for anything else.",
      ],
      after: [
        "The only thing the site stores in your browser is your shopping cart, kept in your browser's own local storage so it survives a page refresh. It stays on your device while you browse. When you check out, the cart's contents are sent to our checkout service so we can build your order and price it. Nothing else in your browser is read or sent.",
      ],
    },
    {
      heading: "Why we hold what we hold",
      bullets: [
        "To take, roast and ship your order.",
        "To tell you when a drop opens, if you asked us to.",
        "To answer you when you write to us.",
        "To keep the records tax and consumer law require us to keep.",
      ],
      after: ["We do not send you marketing you did not ask for. If you want off the waitlist, reply to any email from us or write to us, and we remove you."],
    },
    {
      heading: "Who else touches it",
      paragraphs: ["We use a small number of services to run the shop. Each one sees only what it needs."],
      bullets: [
        "Stripe: name, email, shipping and billing address, and card details, to take payment.",
        "Our checkout service, running on Cloudflare at checkout.berrova.com: what is in your cart, to turn it into a Stripe checkout.",
        "GitHub Pages: standard server request logs, to serve the website.",
        "Our order and inquiry records, held in Airtable and moved there by our n8n automation: waitlist sign-ups, gifting inquiries and order details.",
        "Google Workspace: our email, so we can read and answer what you send us.",
        "The shipping carrier: your name and shipping address, to deliver your order.",
      ],
      after: ["We do not give your details to anyone else, except where the law requires it."],
    },
    {
      heading: "How long we keep it",
      bullets: [
        "Order records: for as long as tax and consumer law require us to keep them.",
        "Waitlist emails: until you ask to be removed, then we delete the address.",
        "Messages you send us: for as long as we need them to answer you and to keep a record of what was agreed.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: ["You can ask us to tell you what we hold about you, correct it if it is wrong, delete it except for records we are legally required to keep, or stop emailing you. Write to us and we will answer within 30 days."],
    },
    {
      heading: "Children",
      paragraphs: ["The site is not for children under 13 and we do not knowingly collect anything from them. If we learn we have, we delete it."],
    },
    {
      heading: "Changes",
      paragraphs: ["If this policy changes we update the date at the top. If the change is material, we email anyone on our list before it takes effect."],
    },
  ],
};

export const SHIPPING: LegalDoc = {
  path: "/shipping",
  eyebrow: "Shipping",
  title: "Shipping policy.",
  intro:
    "We ship within 8 weeks of your order, to the United States, direct from Jamaica. That is slower than most coffee you can buy, and it is the honest cost of buying coffee that is roasted for you after you order.",
  sections: [
    {
      heading: "When your order ships",
      paragraphs: [
        "We ship within 8 weeks of your order. Your coffee is roasted and packaged in Jamaica after you order, then shipped to you direct from the island. Nothing sits in a warehouse waiting for you, because there is no warehouse.",
        "The window is shown before you pay. If we cannot meet it, you can cancel for a full refund.",
      ],
    },
    {
      heading: "If we are late",
      paragraphs: ["If we cannot ship within 8 weeks, we will contact you before that date, without you having to ask. You will have two choices:"],
      bullets: ["Agree to a new date, which we will name, or", "Cancel the order for a full refund."],
      after: [
        "Refunds for a missed shipping date are issued within 7 working days for payments other than credit, or within one billing cycle for credit-card payments.",
        "If we cannot reach you or you do not reply, we cancel the order and refund you.",
      ],
    },
    {
      heading: "Estimated dates can move",
      paragraphs: ["Ship dates depend on harvest arrivals, roasting schedules at origin, and international freight. Where an estimate changes, we tell you and the choices above apply."],
    },
    {
      heading: "Where we ship",
      paragraphs: ["We ship to the United States only. Every order ships direct from Jamaica, which makes each one its own customs entry, and we do not open a destination until we can quote its duty honestly at checkout."],
    },
    {
      heading: "Shipping cost and tax",
      paragraphs: ["Any shipping charge and any sales tax we are required to collect are shown at checkout before you pay. There are no charges after checkout."],
    },
    {
      heading: "Address errors",
      paragraphs: ["We ship to the address you enter at checkout. If it is wrong, tell us before the order ships and we will change it. Once a parcel is with the carrier we cannot redirect it, and a parcel returned to us as undeliverable is refunded minus the outbound shipping we actually paid."],
    },
    {
      heading: "Damaged or wrong on arrival",
      paragraphs: ["If your coffee arrives damaged, or it is not what you ordered, tell us within 14 days of delivery with a photograph. We replace it or refund it, your choice. You do not pay to return anything, and this does not count against the first-bag guarantee in our Refunds and Returns Policy."],
    },
    {
      heading: "Contact",
      paragraphs: [CONTACT_LINE],
    },
  ],
};

export const REFUNDS: LegalDoc = {
  path: "/refunds",
  eyebrow: "Refunds and returns",
  title: "Refunds and returns.",
  intro:
    "Two separate promises. Before roasting, you can cancel any order for a full refund. After delivery, if your first bag is not right for you, tell us within 30 days, send it back on our label, and we refund you.",
  sections: [
    {
      heading: "Before your order ships",
      paragraphs: ["Because your coffee is roasted to order in Jamaica, there is a point after which we cannot unmake it."],
      bullets: [
        "Before roasting begins, you can cancel any order for a full refund, no reason needed. Email us.",
        "After roasting begins, we cannot cancel the order. The coffee was roasted for you and cannot be sold to anyone else.",
      ],
      after: [
        "We email you at least 72 hours before roasting starts, so the cancellation window is never a surprise. If that notice does not reach you, you can cancel for a full refund even after roasting has begun.",
        "Separately from this, if we miss our stated 8-week shipping window you can always cancel for a full refund, whatever stage the order has reached. That right is set out in our Shipping Policy and nothing here limits it.",
      ],
    },
    {
      heading: "After it arrives: the first-bag guarantee",
      paragraphs: ["If your first bag is not right for you, tell us within 30 days of delivery. We send you a prepaid return label. Once the bag is back with us, we refund what you paid for it."],
      bullets: [
        "First order only, one refund per customer.",
        "30 days from delivery, measured by carrier tracking.",
        "The bag has to come back. We pay the return shipping.",
      ],
      after: [
        "Why we ask for the bag back, and why we pay the postage: we are small and we roast a long way away. A returned bag tells us what actually went wrong, the roast, the packaging, or the way we described it. A refund with no bag tells us nothing. Where a returned bag is still good, it goes to tasting and sampling, labelled as a returned bag, never sold as fresh.",
      ],
    },
    {
      heading: "Damaged, wrong, or spoiled",
      paragraphs: ["Not part of the guarantee above and not limited by it. If your order arrives damaged, is the wrong item, or is not fit to drink, tell us within 14 days of delivery with a photograph. We replace or refund it, your choice, and you keep the guarantee."],
    },
    {
      heading: "Subscriptions",
      paragraphs: [
        "You can cancel at any time. There is no minimum commitment and no cancellation fee.",
        "To stop a shipment that is already scheduled, cancel or skip before the roasting date for that shipment. After that the coffee is being roasted for you and the charge stands. We email you at least 72 hours before roasting begins, the same notice a one-off order gets, and if that notice does not reach you, you may cancel that shipment for a full refund even after roasting has started.",
        "Cancelling a subscription stops future charges. It does not refund shipments already roasted or sent.",
      ],
    },
    {
      heading: "Gift orders and bulk",
      paragraphs: ["Corporate, bulk and gifting orders are not covered by the first-bag guarantee. They are handled under the terms of the individual quote. Damaged or wrong deliveries are always put right."],
    },
    {
      heading: "How refunds are paid",
      paragraphs: [
        "Refunds go back to the original payment method. Once we issue a refund, your bank or card issuer decides how quickly it appears.",
        "Refunds for a missed shipping window are issued within 7 working days for payments other than credit, or within one billing cycle for credit-card payments.",
      ],
    },
    {
      heading: "How to start any of this",
      paragraphs: [CONTACT_LINE],
    },
  ],
};

export const LEGAL_DOCS = {
  terms: TERMS,
  privacy: PRIVACY,
  shipping: SHIPPING,
  refunds: REFUNDS,
} as const;

export type LegalId = keyof typeof LEGAL_DOCS;

/** Footer order. */
export const LEGAL_LINKS = [
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
  { label: "Shipping", to: "/shipping" },
  { label: "Refunds and returns", to: "/refunds" },
  { label: "Contact", to: "/contact" },
];
