// Central copy + tokens. Quantities are tokens (proof contract); the brand name
// is {{BRAND}} until locked. Clips are generic licensed stock (Mixkit), shown as
// generic craft, never captioned as a specific named claim. Blue Mountain / forest /
// hand-picked footage sets the high-grown luxury origin tone.

export const BRAND = "{{BRAND}}";
export const HERO_LINE = "Strawberry Hill Reserve";

export const CLIPS = {
  hero: { src: "/assets/video/mountain.mp4", poster: "/assets/video/mountain.jpg" },
  story: { src: "/assets/video/forest.mp4", poster: "/assets/video/forest.jpg" },
  reveal: { src: "/assets/video/beans.mp4", poster: "/assets/video/beans.jpg" },
  steam: { src: "/assets/video/steam.mp4", poster: "/assets/video/steam.jpg" },
  beansPhoto: "/assets/img/beans-dark.jpg",
};

export const NAV = [
  { label: "Reserve", to: "/reserve" },
  { label: "Origins", to: "/#origins" },
  { label: "Story", to: "/story" },
  { label: "Wholesale", to: "/wholesale" },
  { label: "Gifting", to: "/gifting" },
];

export const PROCESS = [
  { word: "Raw", clip: "/assets/video/harvest.mp4", poster: "/assets/video/harvest.jpg", copy: "High-grown cherries, hand-picked ripe in the certified zone. Nothing rushed, nothing padded." },
  { word: "Roasted", clip: "/assets/video/fire.mp4", poster: "/assets/video/fire.jpg", copy: "Roasted at origin and date-stamped at packing, so freshness is a fact you can read, not a promise." },
  { word: "Ground", clip: "/assets/video/beans.mp4", poster: "/assets/video/beans.jpg", copy: "Whole bean or ground to your brew. Same lot, same care, sealed the day it ships." },
  { word: "Poured", clip: "/assets/video/04-pour.mp4", poster: "/assets/video/04-pour.jpg", copy: "A clean, low-acid cup that tastes like the mountain it came from. Best taken black." },
];

export const ORIGINS = [
  { name: "Strawberry Hill Reserve", state: "live", note: "Jamaica Blue Mountain. Certified, quarterly, the hero." },
  { name: "Kenya", state: "waitlist", note: "Candidate origin. Notify me when it lands." },
  { name: "Ethiopia", state: "waitlist", note: "Candidate origin. Notify me when it lands." },
  { name: "More ridgelines", state: "dark", note: "South Africa, Ghana under evaluation." },
];

export const FAQ = [
  { q: "Is this really Jamaica Blue Mountain?", a: "Yes. Sold as Strawberry Hill Reserve, it is single-estate, grown in the certified zone above Kingston, and verified by JACRA. The certificate number is shown on the product and every batch traces to its lot. Most coffee sold under the name is not certified; ours is, and we can prove it." },
  { q: "How does the subscription work?", a: "You choose a cadence and control it yourself: skip, pause, swap origin, size, or grind, or cancel, all self-serve. Subscribers pay a lower per-bag price and get first access to Reserve drops before the public." },
  { q: "Subscribe or one-time?", a: "Both, on every product, never forced. Subscribing is the better deal on price and access; one-time is the same coffee with zero commitment, no account, no auto-renew." },
  { q: "When will my order ship?", a: "We produce close to the drop, so orders carry a stated ship window at checkout. The first orders of a drop can run a little longer while the batch is produced. The window is always shown before you pay, and if we cannot meet it, you can have a refund." },
  { q: "Why only limited quarterly drops?", a: "The scarcity is real. We buy only what we can secure and sell exactly that, then the drop closes until next quarter. When it sells out, it is genuinely gone." },
];
