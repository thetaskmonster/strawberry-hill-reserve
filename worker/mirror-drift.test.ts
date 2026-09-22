// Mirror-drift check for the two copies of the Worker.
//
// This deliberately lives OUTSIDE src/. worker/tsconfig.json types src/ as
// Cloudflare Worker code ("types": ["@cloudflare/workers-types"], no Node
// types) because the Worker runtime genuinely has no filesystem. This check is
// not Worker code -- it is a build-time invariant about two files on disk -- so
// putting it in src/ would mean either fighting that config or weakening it.
// tsconfig's "include" is ["src"], so tsc skips this file; vitest's default
// include still picks it up, which is exactly the split we want.
//
// WHY IT EXISTS. worker.dashboard.js is a standalone single file, pasted into
// the Cloudflare dashboard by hand, so it cannot import anything from src/.
// That puts the shipping country list in two places, and a business rule in two
// places drifts. This is the fence: the copy nobody remembers to update cannot
// quietly keep selling to a country the real Worker has stopped shipping to.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readShipCountries = (relPath: string): string[] => {
  const src = readFileSync(new URL(relPath, import.meta.url), "utf8");
  const m = src.match(/^const SHIP_COUNTRIES = (\[[^\]]*\]);$/m);
  if (!m) throw new Error(`no SHIP_COUNTRIES literal found in ${relPath}`);
  return JSON.parse(m[1]);
};

describe("worker.dashboard.js mirror", () => {
  it("declares the same shipping countries as src/index.ts", () => {
    expect(readShipCountries("./worker.dashboard.js")).toEqual(
      readShipCountries("./src/index.ts"),
    );
  });

  // Canada came out on 2026-09-22 (Kyle's ruling): orders ship direct from
  // Jamaica, every order is its own customs entry, and we cannot quote Canadian
  // duty at checkout yet. Pinned here as well as in src/index.test.ts so that
  // re-adding it to BOTH copies -- which keeps the mirror in agreement -- still
  // fails rather than passing on symmetry alone.
  it("declares US only", () => {
    expect(readShipCountries("./worker.dashboard.js")).toEqual(["US"]);
  });
});
