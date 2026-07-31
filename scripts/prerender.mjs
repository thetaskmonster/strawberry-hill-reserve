// Build-time prerender for the six public routes.
//
// Why: the deployed site is an SPA on GitHub Pages. Without this step every
// deep route (a) serves an empty <div id="root"> shell and (b) returns HTTP
// 404 via the 404.html fallback, so search engines see a one-page site.
// This script loads each route in real Chromium after `vite build`, waits for
// the app (including the per-route meta from src/lib/seo.ts) to render, and
// writes the resulting DOM to dist/<route>/index.html. GitHub Pages then
// serves real 200s with real content; the client bundle re-renders on load as
// normal. It also emits dist/sitemap.xml from the same route list.
//
// Run: node scripts/prerender.mjs   (after `npm run build`; needs Playwright
// Chromium -- `npx playwright install chromium` in CI, or set
// CHROMIUM_EXECUTABLE to an existing binary).

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE_ORIGIN = "https://berrova.com";

// The public, indexable routes. /order/* and the 404 page are deliberately
// absent: they stay on the SPA fallback and carry noindex from seo.ts.
const ROUTES = ["/", "/story", "/reserve", "/gifting", "/wholesale", "/faq"];

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("dist/index.html not found. Run `npm run build` first.");
    process.exit(1);
  }
  // The clean SPA shell, before any route overwrites dist/index.html.
  const shell = await readFile(join(DIST, "index.html"));

  // Tiny static server over dist with SPA fallback to the shell.
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = join(DIST, path === "/" ? "index.html" : path.slice(1));
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(shell);
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  });
  // reducedMotion: the site's own a11y fallback renders scroll-triggered
  // content in its final visible state, so the snapshot carries full text
  // instead of GSAP initial states.
  const context = await browser.newContext({ reducedMotion: "reduce" });

  let failures = 0;
  for (const route of ROUTES) {
    const page = await context.newPage();
    try {
      await page.goto(origin + route, { waitUntil: "networkidle", timeout: 60_000 });
      // The app is rendered and seo.ts has run when the canonical matches the route.
      const expected = `${SITE_ORIGIN}${route}`;
      await page.waitForFunction(
        (want) => document.querySelector('link[rel="canonical"]')?.href === want && document.getElementById("root")?.children.length > 0,
        expected,
        { timeout: 30_000 }
      );
      const html = "<!doctype html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
      const outDir = route === "/" ? DIST : join(DIST, route.slice(1));
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, "index.html"), html);
      const title = await page.title();
      console.log(`prerendered ${route.padEnd(11)} -> ${title}`);
    } catch (err) {
      failures++;
      console.error(`FAILED ${route}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  // Sitemap from the same route list, so it can never drift from what was rendered.
  const today = new Date().toISOString().slice(0, 10);
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ROUTES.map((r) => `  <url><loc>${SITE_ORIGIN}${r === "/" ? "/" : r}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  await writeFile(join(DIST, "sitemap.xml"), sitemap);
  console.log(`sitemap.xml written (${ROUTES.length} URLs)`);

  if (failures > 0) {
    console.error(`${failures} route(s) failed to prerender.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
