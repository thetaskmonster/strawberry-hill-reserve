// Central copy. Berrova is the house-brand name (multi-origin luxury
// coffee); Strawberry Hill Reserve is the featured drop, not the whole company.
// No invented numbers anywhere: certificate numbers and roast dates live on the
// physical bag and render from source at launch, so marketing copy states the
// claim ("JACRA certified") without printing a fabricated value. The drop values
// below (200 bags, Sept 1) are the founder's real launch parameters.

export const BRAND = "Berrova"; // house brand (locked 2026-07-24)
export const HERO_LINE = "Strawberry Hill Reserve";
export const INQUIRY_EMAIL = "wecare@gsccapitalgroup.com";

export const DROP = { units: "200", opens: "Sept 1", opensISO: "2026-09-01" };

// Base-aware asset paths. import.meta.env.BASE_URL is "/" for a root/artifact build
// (folds back to "/assets/..." so the single-file inliner still matches) and
// "/<repo>/" for a GitHub Pages project deploy, so runtime asset URLs resolve there.

export const CLIPS = {
  hero: { src: import.meta.env.BASE_URL + "assets/video/mountain.mp4", poster: import.meta.env.BASE_URL + "assets/video/mountain.jpg" },
  story: { src: import.meta.env.BASE_URL + "assets/video/forest.mp4", poster: import.meta.env.BASE_URL + "assets/video/forest.jpg" },
  reveal: { src: import.meta.env.BASE_URL + "assets/video/beans.mp4", poster: import.meta.env.BASE_URL + "assets/video/beans.jpg" },
  steam: { src: import.meta.env.BASE_URL + "assets/video/steam.mp4", poster: import.meta.env.BASE_URL + "assets/video/steam.jpg" },
  beansPhoto: import.meta.env.BASE_URL + "assets/img/beans-dark.jpg",
  bag: import.meta.env.BASE_URL + "assets/img/bag-front.png",
  certMark: import.meta.env.BASE_URL + "assets/img/jbm-cert-mark.png",
};

export const NAV = [
  { label: "Coffee", to: "/reserve" },
  { label: "Origins", to: "/#origins" },
  { label: "Story", to: "/story" },
  { label: "Wholesale", to: "/wholesale" },
  { label: "Gifting", to: "/gifting" },
];

export const PROCESS = [
  { word: "Grown", clip: import.meta.env.BASE_URL + "assets/video/harvest.mp4", poster: import.meta.env.BASE_URL + "assets/video/harvest.jpg", copy: "High on the slope, picked by hand at ripeness. Small lots, grown slow, never rushed for yield." },
  { word: "Roasted", clip: import.meta.env.BASE_URL + "assets/video/fire.mp4", poster: import.meta.env.BASE_URL + "assets/video/fire.jpg", copy: "Roasted to order and date-stamped as it is packed. Freshness you can read on the bag, not just take on faith." },
  { word: "Sealed", clip: import.meta.env.BASE_URL + "assets/video/beans.mp4", poster: import.meta.env.BASE_URL + "assets/video/beans.jpg", copy: "Whole bean or ground to your brew, then sealed the day it ships. The same lot, start to finish." },
  { word: "Poured", clip: import.meta.env.BASE_URL + "assets/video/04-pour.mp4", poster: import.meta.env.BASE_URL + "assets/video/04-pour.jpg", copy: "A clean, quiet cup with the balance that only altitude gives. Best taken black, so the coffee is what you taste." },
];

// img is generic, representative regional/craft imagery (free-license), never a
// specific-estate claim; alt text stays generic and the state chips keep it honest.
export const ORIGINS = [
  { name: "Strawberry Hill Reserve", place: "Jamaica Blue Mountain", state: "live", note: "The featured drop. Certified, single-estate, quarterly.", img: import.meta.env.BASE_URL + "assets/img/bm-peak.png" },
  { name: "Kenya", place: "Nyeri, high-grown", state: "waitlist", note: "In the range next. Join the list to be notified first.", img: import.meta.env.BASE_URL + "assets/video/forest.jpg" },
  { name: "Ethiopia", place: "Heirloom, washed", state: "waitlist", note: "In the range next. Join the list to be notified first.", img: import.meta.env.BASE_URL + "assets/video/harvest.jpg" },
  { name: "The next ridgeline", place: "Under evaluation", state: "dark", note: "Sourced only when it clears the bar. No buyable ghosts.", img: import.meta.env.BASE_URL + "assets/video/steam.jpg" },
];

export const FAQ = [
  { q: "What is Berrova?", a: "A small coffee house built on high-grown, honestly sourced origins, roasted to order. We keep the range short and let each origin earn its place. Strawberry Hill Reserve, our certified Jamaica Blue Mountain, is the featured drop." },
  { q: "How does the subscription work?", a: "You choose a cadence and control it yourself: skip, pause, swap origin, size, or grind, or cancel, all self-serve. Subscribers pay a lower per-bag price and get first access to drops before the public." },
  { q: "Subscribe or one-time?", a: "Both, on every coffee, never forced. Subscribing is the better deal on price and access; one-time is the same coffee with zero commitment, no account, no auto-renew." },
  { q: "When will my order ship?", a: "We produce close to each drop, so orders carry a stated ship window at checkout. The first orders of a drop can run a little longer while the batch is produced. The window is always shown before you pay, and if we cannot meet it, you can have a refund." },
  { q: "Why only limited drops?", a: "We buy only what we can secure and sell exactly that, then the drop closes until the next one. It keeps the coffee fresh and the story honest. When a drop sells out, it is genuinely gone." },
];
