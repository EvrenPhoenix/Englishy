// Checks the Worker serving the embedded frontend (run `npx wrangler dev` first).
// Usage: node scripts/check-worker.mjs [base]   (default http://127.0.0.1:8787)
// Covers deep links, static files and headers, the API, and offline use through the
// service worker.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:8787";
let failed = 0;
const check = async (name, fn) => {
  try {
    await fn();
    console.log("PASS", name);
  } catch (error) {
    failed++;
    console.log("FAIL", name, "-", error.message.split("\n")[0]);
  }
};

const appRoutes = [
  "/",
  "/start",
  "/placement",
  "/guides/learn-english-for-beginners",
  "/home",
  "/learn",
  "/learn/pa1-alphabet",
  "/practise",
  "/practice",
  "/tutor",
  "/conversation",
  "/conversation/ordering-food",
  "/speaking",
  "/vocabulary",
  "/grammar",
  "/grammar/present-simple",
  "/writing",
  "/progress",
  "/settings",
  "/help",
  "/privacy",
  "/no-such-page",
];
const index = await (await fetch(base + "/")).text();
const entry = index.match(
  /<script type="module" crossorigin src="([^"]+)"/,
)?.[1];

await check(
  "deep links return the app shell with security headers",
  async () => {
    for (const path of appRoutes) {
      const res = await fetch(base + path);
      assert.equal(res.status, 200, path);
      assert.match(res.headers.get("content-type"), /text\/html/, path);
      assert.match(
        res.headers.get("content-security-policy") ?? "",
        /script-src 'self'/,
        path,
      );
      assert.equal(res.headers.get("x-content-type-options"), "nosniff", path);
      assert.equal(await res.text(), index, path);
    }
  },
);
await check("hashed assets are immutable and revalidate by ETag", async () => {
  assert.ok(entry, "entry script in index.html");
  const res = await fetch(base + entry);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /javascript/);
  assert.match(res.headers.get("cache-control"), /immutable/);
  const again = await fetch(base + entry, {
    headers: { "If-None-Match": res.headers.get("etag") },
  });
  assert.equal(again.status, 304);
});
await check("static files", async () => {
  const expect = {
    "/sw.js": /javascript/,
    "/theme-init.js": /javascript/,
    "/offline": /html/,
    "/offline.html": /html/,
    "/manifest.webmanifest": /manifest\+json/,
    "/robots.txt": /text\/plain/,
    "/sitemap.xml": /xml/,
    "/icons/favicon.svg": /svg/,
    "/icons/icon-512.png": /png/,
    "/og/og-image.png": /png/,
  };
  for (const [path, type] of Object.entries(expect)) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get("content-type"), type, path);
  }
  assert.equal(
    (await fetch(base + "/sw.js")).headers.get("cache-control"),
    "no-cache",
  );
});
await check("missing files are 404, not the app shell", async () => {
  for (const path of ["/assets/does-not-exist.js", "/missing.png"]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 404, path);
  }
});
await check("service worker precaches files that exist", async () => {
  const sw = await (await fetch(base + "/sw.js")).text();
  const list = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
  assert.ok(list.includes(entry), "entry is precached");
  for (const path of list)
    assert.equal((await fetch(base + path)).status, 200, path);
});
await check("API health and status", async () => {
  assert.deepEqual(await (await fetch(base + "/api/health")).json(), {
    ok: true,
  });
  const status = await (await fetch(base + "/api/ai/status")).json();
  assert.equal(typeof status.available, "boolean");
});

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
await check("works offline after the service worker installs", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base + "/learn");
  await page.locator("main h1").waitFor();
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((ok) =>
        navigator.serviceWorker.addEventListener("controllerchange", ok),
      );
    return registration.active?.state;
  });
  await context.setOffline(true);
  for (const path of [
    "/learn/pa1-alphabet",
    "/grammar/articles",
    "/vocabulary?tab=browse",
  ]) {
    await page.goto(base + path);
    await page.locator("main h1").waitFor({ timeout: 10_000 });
  }
  await page
    .locator("[role=status]", { hasText: /offline/i })
    .first()
    .waitFor();
  await context.close();
  assert.deepEqual(errors, []);
});
await browser.close();
process.exit(failed ? 1 : 0);
