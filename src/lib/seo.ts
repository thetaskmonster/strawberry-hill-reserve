// Per-route SEO: title, description, canonical, Open Graph, JSON-LD.
// One hook, called once from App keyed on the route, so client navigation and
// the build-time prerender (scripts/prerender.mjs) stay in sync automatically.
// Honesty line applies here exactly as on the page: no ratings, no review
// counts, no invented numbers. The only quantities are the real catalog prices
// (src/content/store.ts) and the real FAQ copy (src/content/site.ts).

import { useEffect } from "react";
import { BRAND, HERO_LINE, FAQ } from "../content/site";
import { CATALOG } from "../content/store";

export const SITE_ORIGIN = "https://berrova.com";
const OG_IMAGE = `${SITE_ORIGIN}/assets/video/mountain.jpg`;

type RouteMeta = {
  title: string;
  description: string;
  /** Social-preview copy when it should differ from the search description. */
  ogDescription?: string;
  /** Routes that must not be indexed (checkout returns, 404). */
  noindex?: boolean;
};

const DEFAULT_META: RouteMeta = {
  title: `${BRAND} · ${HERO_LINE}`,
  description:
    "Certified Jamaica Blue Mountain in genuine limited drops, plus a small multi-origin house range. Provable authenticity, roasted at origin.",
  ogDescription:
    "Most Blue Mountain is faked. Ours is proven. Certified Jamaica Blue Mountain in genuine quarterly drops.",
};

const ROUTE_META: Record<string, RouteMeta> = {
  "/": DEFAULT_META,
  "/story": {
    title: `The Story · ${BRAND}`,
    description:
      "Most Blue Mountain coffee never saw the Blue Mountains. Ours is JACRA-certified, single-estate, roasted at origin, and traceable to its lot. The story of how we keep it honest.",
  },
  "/reserve": {
    title: `${HERO_LINE} · Certified Jamaica Blue Mountain | ${BRAND}`,
    description:
      "Certified Jamaica Blue Mountain, roasted to order and date-stamped. 8 oz and 16 oz bags, subscribe or one-time on every coffee, quarterly limited drops.",
  },
  "/gifting": {
    title: `Corporate Gifting · ${BRAND}`,
    description:
      "Certified Jamaica Blue Mountain gift boxes for clients and teams. Provable authenticity, boxed sets, direct inquiry, no platforms in between.",
  },
  "/wholesale": {
    title: `Wholesale · ${BRAND}`,
    description:
      "Certified Jamaica Blue Mountain for cafes, hotels, and fine dining. Small lots, roasted to order, documentation with every batch.",
  },
  "/faq": {
    title: `FAQ · ${BRAND}`,
    description:
      "Subscriptions, ship windows, limited drops, and how we prove the coffee is what it says it is.",
  },
  "/order/success": { ...DEFAULT_META, noindex: true },
  "/order/cancelled": { ...DEFAULT_META, noindex: true },
};

// ---------- JSON-LD ----------

function organizationLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND,
    url: SITE_ORIGIN,
    logo: OG_IMAGE,
  };
}

function productLd(): object {
  const prices = CATALOG.map((s) => s.oneTimeCents / 100);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: HERO_LINE,
    brand: { "@type": "Brand", name: BRAND },
    description: ROUTE_META["/reserve"].description,
    image: `${SITE_ORIGIN}/assets/img/bag-front.webp`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: CATALOG.length,
      availability: "https://schema.org/PreOrder",
      url: `${SITE_ORIGIN}/reserve`,
    },
  };
}

function faqLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function jsonLdFor(path: string): object | null {
  if (path === "/") return organizationLd();
  if (path === "/reserve") return productLd();
  if (path === "/faq") return faqLd();
  return null;
}

// ---------- DOM plumbing (update-in-place, never append duplicates) ----------

function setMetaByName(name: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setRobots(noindex: boolean): void {
  const el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex) {
    setMetaByName("robots", "noindex, nofollow");
  } else if (el) {
    el.remove();
  }
}

function setJsonLd(data: object | null): void {
  const ID = "seo-jsonld";
  let el = document.getElementById(ID);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.id = ID;
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Apply route metadata. Call once per location change. */
export function applyPageMeta(path: string): void {
  // Normalize: strip trailing slash except root.
  const key = path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
  const meta = ROUTE_META[key] ?? { ...DEFAULT_META, noindex: true }; // unknown = 404 page
  const url = `${SITE_ORIGIN}${key === "/" ? "/" : key}`;

  document.title = meta.title;
  setMetaByName("description", meta.description);
  setCanonical(url);
  setMetaByProperty("og:title", meta.title);
  setMetaByProperty("og:description", meta.ogDescription ?? meta.description);
  setMetaByProperty("og:url", url);
  setMetaByProperty("og:image", OG_IMAGE);
  setMetaByProperty("og:site_name", BRAND);
  setRobots(Boolean(meta.noindex));
  setJsonLd(jsonLdFor(key));
}

/** Hook form for App: applies metadata on every route change. */
export function usePageMeta(path: string): void {
  useEffect(() => {
    applyPageMeta(path);
  }, [path]);
}
