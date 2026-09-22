// Drift fence for the two copies of the Worker.
//
// This deliberately lives OUTSIDE src/. worker/tsconfig.json types src/ as
// Cloudflare Worker code ("types": ["@cloudflare/workers-types"], no Node
// types) because the Worker runtime genuinely has no filesystem. This check is
// not Worker code -- it is a build-time invariant about two files on disk -- so
// putting it in src/ would mean either fighting that config or weakening it.
// tsconfig's "include" is ["src"], so tsc skips this file; vitest's default
// include still runs it. The honest cost of that split: this file is never
// typechecked. Its behaviour is covered because vitest executes it.
//
// WHY IT EXISTS. worker.dashboard.js is a standalone single file, pasted into
// the Cloudflare dashboard by hand, so it cannot import anything from src/.
// That puts business rules in two places, and a rule in two places drifts.
//
// ===================================================================
// READ THIS BEFORE TRUSTING THE WORD "MIRROR" ANYWHERE IN THIS REPO.
// ===================================================================
//
// worker.dashboard.js is NOT a mirror of src/index.ts, and the comments in both
// files that call it one are overstating the case. This file pins the two
// business-data rules below and NOTHING ELSE. The copies diverge on behaviour,
// and one divergence is serious:
//
//   worker.dashboard.js HAS NO GUARD-TOKEN GATE AT ALL.
//
// src/index.ts checks a shared secret (CHECKOUT_GUARD_TOKEN, sent as the
// X-Berrova-Guard header, compared with timingSafeEqual). The dashboard copy
// contains none of those three things. It authenticates on the Origin header
// alone, which any non-browser client sets freely. If the dashboard copy is
// what is actually deployed, the checkout endpoint is effectively open and
// anyone can mint Stripe Checkout Sessions against the live key.
//
// That divergence PREDATES this file and is NOT fixed here, because fixing it
// is a security change that deserves its own review rather than a ride-along in
// a shipping-country commit. It is pinned below as a KNOWN divergence so that
// it fails loudly if someone "fixes" it halfway, and so that no reader of the
// word "mirror" is misled into thinking the copies are held in agreement.
//
// wrangler.toml sets main = "src/index.ts", so `wrangler deploy` ships the
// guarded copy. That is a SETTING, not evidence of what the live Worker
// contains. If it was ever hand-pasted, a clean repo tells you nothing.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = "./src/index.ts";
const DASH = "./worker.dashboard.js";

const read = (relPath: string): string =>
  readFileSync(new URL(relPath, import.meta.url), "utf8");

// The `\n` exclusion in the character class is load-bearing. Without it a
// reformat of the constant across several lines matched anyway and handed a
// trailing comma to JSON.parse, which threw "Unexpected token ']'" -- a real
// failure, but one that misdirects whoever reads it. Now a reformat produces
// this function's own message instead.
const readShipCountries = (relPath: string): string[] => {
  const src = read(relPath);
  const m = src.match(/^const SHIP_COUNTRIES = (\[[^\]\n]*\]);$/m);
  if (!m) throw new Error(`no single-line SHIP_COUNTRIES literal found in ${relPath}`);
  return JSON.parse(m[1]);
};

const readPriceIds = (relPath: string): string[] => {
  const src = read(relPath);
  const block = src.match(/const PRICE_MAP[^=]*= \{([\s\S]*?)\n\};/);
  if (!block) throw new Error(`no PRICE_MAP literal found in ${relPath}`);
  return [...block[1].matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]).sort();
};

const readPriceCents = (relPath: string): string[] => {
  const src = read(relPath);
  const block = src.match(/const PRICE_MAP[^=]*= \{([\s\S]*?)\n\};/);
  if (!block) throw new Error(`no PRICE_MAP literal found in ${relPath}`);
  return [...block[1].matchAll(/^\s*"([^"]+)": \{ name: "([^"]*)", oneTimeCents: (\d+), subscribeCents: ([^ ]+) \}/gm)]
    .map((m) => `${m[1]}|${m[2]}|${m[3]}|${m[4]}`)
    .sort();
};

describe("worker.dashboard.js drift fence", () => {
  it("declares the same shipping countries as src/index.ts", () => {
    expect(readShipCountries(DASH)).toEqual(readShipCountries(SRC));
  });

  // Canada came out on 2026-09-22 (Kyle's ruling): orders ship direct from
  // Jamaica, every order is its own customs entry, and we cannot quote Canadian
  // duty at checkout yet. Pinned here as well as in src/index.test.ts so that
  // re-adding it to BOTH copies -- which keeps them in agreement -- still fails
  // rather than passing on symmetry alone.
  it("declares US only", () => {
    expect(readShipCountries(DASH)).toEqual(["US"]);
  });

  // The literal comparison above is textual, so it says nothing about a
  // statement that mutates the array afterwards. `const` binds the reference,
  // not the contents, and no test executes the dashboard copy, so
  // `SHIP_COUNTRIES.push("CA")` on the next line passed everything. Contrived,
  // but it is the exact shape of bypass a text fence has, so close it.
  it("never mutates the country list after declaring it", () => {
    const calls = [...read(DASH).matchAll(/SHIP_COUNTRIES\.(\w+)/g)].map((m) => m[1]);
    expect(calls).toEqual(["forEach"]);
  });

  // PRICE_MAP is the more dangerous duplicate of the two. Both files say in
  // their own comments "if you change a price, change it in BOTH files", which
  // is a convention with no mechanism behind it, and the failure mode is
  // charging the wrong amount rather than offering the wrong country.
  it("declares the same SKUs as src/index.ts", () => {
    expect(readPriceIds(DASH)).toEqual(readPriceIds(SRC));
  });

  it("declares the same name and price for every SKU as src/index.ts", () => {
    expect(readPriceCents(DASH)).toEqual(readPriceCents(SRC));
  });

  // Pinning a KNOWN divergence, not endorsing it. See the header. This fails if
  // someone adds the guard gate to the dashboard copy, which is the right
  // outcome: that change must come with a real review, and this test is where
  // its author learns this file exists.
  it("has no guard-token gate, which is a KNOWN and unfixed divergence", () => {
    const dash = read(DASH);
    const src = read(SRC);
    const guardTokens = ["guardTokenValid", "CHECKOUT_GUARD_TOKEN", "X-Berrova-Guard", "timingSafeEqual"];
    expect(guardTokens.filter((t) => src.includes(t))).toEqual(guardTokens);
    expect(guardTokens.filter((t) => dash.includes(t))).toEqual([]);
  });
});
