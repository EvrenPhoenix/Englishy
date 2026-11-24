// Runs page flows from compare-routes.mjs (plus optional `after` steps) on both builds
// and compares the stored learner data afterwards. Random ids (act_/res_/uuid) are
// normalised; everything else, including timestamps under the frozen clock, must match.
// Usage: node scripts/check-flow-data.mjs <name>[,<name>...]
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { seedSavedProfile, snapshotProfile } from "./saved-profile.mjs";
import { pages } from "./compare-routes.mjs";
import { mockApi } from "./api-fixtures.mjs";

const REF = process.env.REF_BASE ?? "http://127.0.0.1:8787";
const NEW = process.env.NEW_BASE ?? "http://127.0.0.1:4173";
const names = process.argv[2].split(",");

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const normalise = (snapshot) =>
  JSON.parse(JSON.stringify(snapshot).replace(uuid, "<id>"), (key, value) =>
    Array.isArray(value) &&
    value.every((row) => row && typeof row === "object" && "key" in row)
      ? [...value].sort((a, b) =>
          JSON.stringify(a.value).localeCompare(JSON.stringify(b.value)),
        )
      : value,
  );

async function run(browser, base, page) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
  });
  const tab = await ctx.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(String(e)));
  await mockApi(tab, [], page.api ?? {});
  if (page.init) await tab.addInitScript(page.init);
  await seedSavedProfile(tab, base);
  if (page.seed) await page.seed(tab, base);
  await tab.goto(base + page.path);
  if (page.ready) await page.ready(tab);
  if (page.act) await page.act(tab);
  if (page.after) await page.after(tab);
  await tab.waitForTimeout(500);
  const snap = normalise(await snapshotProfile(tab));
  const url = new URL(tab.url()).pathname;
  await ctx.close();
  return { snap, url, errors };
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
let failed = 0;
for (const name of names) {
  const [ref, neu] = await Promise.all([
    run(browser, REF, pages[name]),
    run(browser, NEW, pages[name]),
  ]);
  try {
    assert.deepEqual(neu.snap, ref.snap);
    assert.equal(neu.url, ref.url);
    assert.deepEqual(neu.errors, ref.errors);
    console.log("PASS", name, "→", neu.url);
  } catch (e) {
    failed++;
    console.log("FAIL", name, e.message.slice(0, 2500));
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
