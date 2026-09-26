// Central copy. Berrova is the house-brand name (multi-origin luxury
// coffee); Strawberry Hill is the featured drop, not the whole company.
// No invented numbers anywhere: certificate numbers and roast dates live on the
// physical bag and render from source at launch, so marketing copy states the
// claim ("JACRA certified") without printing a fabricated value. The drop values
// below (200 bags, Oct 1) are the founder's real launch parameters.

export const BRAND = "Berrova"; // house brand (locked 2026-07-24)
export const HERO_LINE = "Strawberry Hill";
// Berrova's own mailbox. The domain sends, receives and authenticates as of
// 2026-09-20 (DKIM, SPF and DMARC all pass on a delivered message). Until then
// this line carried wecare@gsccapitalgroup.com, which is a different company.
export const INQUIRY_EMAIL = "thepour@berrova.com";

export const DROP = { units: "200", opens: "Oct 1", opensISO: "2026-10-01" };

// Presale gate. "waitlist" hides every purchase path and routes intent into the
// drop waitlist; "live" restores the full store. Flip this ONE value on drop
// day. While "waitlist", nothing on the site can take money, so the FTC
// ship-window clock never starts before inventory is real.
export const PRESALE_MODE = "waitlist" as "waitlist" | "live";

// Price visibility. While the drop is a waitlist we do not publish the price
// list: the page teases access, not numbers, and every figure returns on the
// same flip that opens the store. NOTE the honest limit -- the CATALOG in
// content/store.ts still ships inside the JS bundle, so this hides prices from
// the page, not from anyone who opens devtools. It is a launch tease, not a
// secret. The Worker remains the authority at charge time either way.
export const SHOW_PRICES = PRESALE_MODE === "live";

// Drop waitlist capture. Posts form-encoded (no CORS preflight) to the n8n
// "Berrova Waitlist Capture" webhook, which validates and writes the Airtable
// Waitlist row. Copy honors the honesty line: 200 bags and Oct 1 are real
// launch parameters; first access is the real mechanic; nothing is invented.
export const WAITLIST = {
  endpoint: "https://capturethisvibe.app.n8n.cloud/webhook/berrova-waitlist-a7c2",
  headline: "POUR FIRST",
  sub: "The first drop is 200 bags, opening Oct 1. The waitlist gets first access before it opens to the public. When they are gone, the drop closes.",
  button: "Join the waitlist",
  placeholder: "you@email.com",
  success: "You are on the list. When the drop opens, you pour first.",
  failure: "That did not go through. Check the email and try again.",
};

// Inbound corporate-gifting capture. Same shape as WAITLIST above and for the
// same reason: form-encoded so the browser sends it as a CORS simple request
// with no preflight, to the n8n "Berrova Gifting Inquiry Capture" webhook,
// which validates and writes the Airtable "Gifting Inquiries" row.
//
// This exists because the gifting form used to be a mailto: handoff and
// nothing else. On a device with no mail client the navigation was a silent
// no-op and the lead was gone with no trace anywhere. Saving here FIRST means
// the mail draft is a convenience, not the only record.
export const GIFTING = {
  endpoint: "https://capturethisvibe.app.n8n.cloud/webhook/berrova-gifting-9f3d",
  defaultSource: "gifting-form",
};

// Base-aware asset paths. import.meta.env.BASE_URL is "/" for a root/artifact build
// (folds back to "/assets/..." so the single-file inliner still matches) and
// "/<repo>/" for a GitHub Pages project deploy, so runtime asset URLs resolve there.

export const CLIPS = {
  hero: { src: import.meta.env.BASE_URL + "assets/video/hero-v2.mp4", poster: import.meta.env.BASE_URL + "assets/video/hero-v2.jpg" },
  story: { src: import.meta.env.BASE_URL + "assets/video/forest.mp4", poster: import.meta.env.BASE_URL + "assets/video/forest.jpg" },
  reveal: { src: import.meta.env.BASE_URL + "assets/video/beans.mp4", poster: import.meta.env.BASE_URL + "assets/video/beans.jpg" },
  steam: { src: import.meta.env.BASE_URL + "assets/video/steam.mp4", poster: import.meta.env.BASE_URL + "assets/video/steam.jpg" },
  // Decorative atmospheric b-roll (licensed/generic, makes no specific-business claim).
  ridgeBroll: { src: import.meta.env.BASE_URL + "assets/video/ridge-broll.mp4", poster: import.meta.env.BASE_URL + "assets/video/ridge-broll.jpg" },
  beansBroll: { src: import.meta.env.BASE_URL + "assets/video/beans-broll.mp4", poster: import.meta.env.BASE_URL + "assets/video/beans-broll.jpg" },
  pourBroll: { src: import.meta.env.BASE_URL + "assets/video/pour-broll.mp4", poster: import.meta.env.BASE_URL + "assets/video/pour-broll.jpg" },
  beansPhoto: import.meta.env.BASE_URL + "assets/img/beans-dark.webp",
  // The bag image is a COMPOSITE, not a photograph of a bag that exists.
  //
  // The photograph it is built on showed the old front panel, which read
  // `8 OZ  NET WT. 277G`. The true weight is 227 g, so the store was
  // publishing a net weight wrong by 50 grams. A net weight in advertising is
  // the same statement 21 CFR 101.7 governs on the bag itself, and the
  // nutrition exemption the product relies on is void if a nutrition claim
  // appears in advertising.
  //
  // WHAT THIS IMAGE IS, as of 2026-09-26, and what it replaced.
  //
  // It is the stand-up pouch RENDER Kyle picked on 2026-09-24 for the first
  // Instagram post, fitted to the 1500 px square this slot has always held.
  // It replaces a composite that was RIGHT ABOUT THE PRINTING AND WRONG ABOUT
  // THE BAG: our gated 8 oz panel, warped by image arithmetic onto a
  // photograph of a squared, side-gusseted block bag with a flat crimped top.
  // Kyle ruled a stand-up pouch with a bottom gusset on 2026-09-22 (the
  // decisions log, that row) and the block-bag shape was known and recorded
  // in this comment the same day, to be closed "when our own pouch is printed
  // and photographed". On 2026-09-26, five days before the drop, he looked at
  // the live store and ruled the wrong shape comes off the site NOW rather
  // than then: "its not the right bag". Stopgap first, proper fix behind it.
  //
  // THIS CROSSES A LINE THE PREVIOUS COMMENT DREW, AND SAYS SO. It used to
  // read "Nothing is AI-generated: a rendered label is a rendered claim." This
  // image IS a generated render, text and all. It is here because the shape
  // it shows is the product and the shape it replaced was not, and Kyle chose
  // that trade with the cost stated. Two consequences, both real:
  //
  //   1. The text on this pouch is NOT our print-ready artwork. Its net
  //      quantity line reads "NET WT. 227 g (8 oz)", metric first; the gated
  //      panels we will actually print read "NET WT 8 OZ (227 g)". The weight
  //      itself is correct, 227 g, which is the one figure the previous
  //      fix existed to get right. Its type size is unmeasured and ungated.
  //      Nothing on this site may quote this image as the label.
  //   2. It is INTERIM. The proper fix is a blank stand-up pouch base at
  //      full resolution with the gated panel composited onto it through the
  //      vault's existing pipeline, warp proof re-run, provenance recorded.
  //      When that lands this comment is rewritten again, not appended to.
  //
  // What did not change: this is still our specification of the product, not
  // a photograph of a shipped unit, and no copy on this site may describe it
  // as one, because THE POUCH IT SHOWS HAS NOT BEEN PRINTED.
  //
  // Where this lives:
  //   Strawberry Hill Reserve/08-PRODUCTS-OFFERS/brand-assets/std-scene-40-catalogue-hero-roundel-fixed.png
  //     (the source render, 928 x 1152, sha256 a5e59004...)
  //   Strawberry Hill Reserve/08-PRODUCTS-OFFERS/pouch-specification.md   (construction, section 1)
  //   Strawberry Hill Reserve/01-COMPANY/decisions-log.md   (2026-09-22 row: own pouch, stand-up, bottom gusset)
  //
  // How the square was made, so it can be redone: the render was scaled to
  // 1500 px tall with Lanczos, centred, and the 146 px either side filled by
  // stretching that row's own outermost columns rather than a flat colour,
  // then softened, so the vignette carries across. Measured step at the join:
  // under 2 levels of 255 on every sampled row.
  bag: import.meta.env.BASE_URL + "assets/img/bag-front.webp",
  certMark: import.meta.env.BASE_URL + "assets/img/jbm-cert-mark.webp",
};

export const NAV = [
  { label: "Coffee", to: "/reserve" },
  { label: "Origins", to: "/#origins" },
  { label: "Story", to: "/story" },
  { label: "Wholesale", to: "/wholesale" },
  { label: "Gifting", to: "/gifting" },
];

export const PROCESS = [
  { word: "Grown", clip: import.meta.env.BASE_URL + "assets/video/grown-tile.mp4", poster: import.meta.env.BASE_URL + "assets/video/grown-tile.jpg", copy: "High on the slope, picked by hand at ripeness. Small lots, grown slow, never rushed for yield." },
  { word: "Roasted", clip: import.meta.env.BASE_URL + "assets/video/roasted-tile.mp4", poster: import.meta.env.BASE_URL + "assets/video/roasted-tile.jpg", copy: "Roasted to order and date-stamped as it is packed. Freshness you can read on the bag, not just take on faith." },
  { word: "Sealed", clip: import.meta.env.BASE_URL + "assets/video/sealed-tile.mp4", poster: import.meta.env.BASE_URL + "assets/video/sealed-tile.jpg", copy: "Sealed at origin. Blue Mountain is a protected product. We cannot repack it once it leaves the island." },
  { word: "Poured", clip: import.meta.env.BASE_URL + "assets/video/poured-tile.mp4", poster: import.meta.env.BASE_URL + "assets/video/poured-tile.jpg", copy: "A clean, quiet cup with the balance that only altitude gives. Best taken black, so the coffee is what you taste." },
];

// img is generic, representative regional/craft imagery (free-license), never a
// specific-estate claim; alt text stays generic and the state chips keep it honest.
export const ORIGINS = [
  { name: "Strawberry Hill", slug: "strawberry-hill-reserve", place: "Jamaica Blue Mountain", state: "live", note: "The featured drop. JACRA-certified, quarterly.", img: import.meta.env.BASE_URL + "assets/img/bm-peak.webp" },
  { name: "Kenya", slug: "kenya", place: "Nyeri, high-grown", state: "waitlist", note: "In the range next. Join the list to be notified first.", img: import.meta.env.BASE_URL + "assets/video/forest.jpg" },
  { name: "Ethiopia", slug: "ethiopia", place: "Heirloom, washed", state: "waitlist", note: "In the range next. Join the list to be notified first.", img: import.meta.env.BASE_URL + "assets/video/harvest.jpg" },
  { name: "The next ridgeline", slug: "next-ridgeline", place: "Under evaluation", state: "dark", note: "Sourced only when it clears the bar. No buyable ghosts.", img: import.meta.env.BASE_URL + "assets/video/steam.jpg" },
];

export const FAQ = [
  { q: "What is Berrova?", a: "A small coffee house built on high-grown, honestly sourced origins, roasted to order. We keep the range short and let each origin earn its place. Strawberry Hill, our JACRA-certified Jamaica Blue Mountain, is the featured drop." },
  { q: "How does the subscription work?", a: "You choose a cadence and control it yourself: skip, pause, swap origin or size, or cancel, all self-serve. Subscribers pay a lower per-bag price and get first access to drops before the public." },
  { q: "Subscribe or one-time?", a: "Both, on every coffee, never forced. Subscribing is the better deal on price and access; one-time is the same coffee with zero commitment, no account, no auto-renew." },
  { q: "When will my order ship?", a: "Within 8 weeks. Nothing sits in a warehouse waiting for you, because there is no warehouse: your coffee is roasted and packaged in Jamaica after you order, and it ships to you direct from the island. Fresh from the source, and we never hold stock. That is slower than most coffee you can buy, and it is the honest cost of buying it this way. The window is always shown before you pay, and if we cannot meet it, you can cancel for a full refund." },
  { q: "Why only limited drops?", a: "We buy only what we can secure and sell exactly that, then the drop closes until the next one. It keeps the coffee fresh and the story honest. When a drop sells out, it is genuinely gone." },
  { q: "What if I don't love it?", a: "Message us within 30 days of delivery. We will provide a return label, and once the bag is back with us, we will refund you. This covers your first order, once per customer. The clock starts when the coffee reaches you, not when you order, because we ship within 8 weeks and a window that started at checkout would be gone before the bag arrived. It is separate from the ship-window promise above, that one covers us being late, this one covers you not liking the coffee." },
];
