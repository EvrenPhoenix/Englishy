import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { seedSavedProfile, snapshotProfile } from "./saved-profile.mjs";
const routes = {
  Landing: "/",
  GrammarPage: "/grammar",
  LearnPage: "/learn",
  ConversationList: "/conversation",
  ProgressPage: "/progress",
};
async function check(browser, base, name) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    timezoneId: "UTC",
  });
  try {
    const page = await ctx.newPage(),
      errors = [],
      api = [],
      states = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.pathname.startsWith("/api/"))
        api.push([r.method(), u.pathname + u.search, r.postData()]);
    });
    await seedSavedProfile(page, base, "light", "en");
    const before = await snapshotProfile(page);
    await page.goto(base + routes[name]);
    const main = page.locator("main"),
      btn = (n) => main.getByRole("button", { name: n, exact: true });
    const save = async () => {
      await page.waitForLoadState("networkidle");
      states.push(await main.innerText());
    };
    if (name === "Landing") {
      await main.locator("h1").waitFor();
      await save();
      const dark = page.getByRole("radio").nth(1);
      await dark.click();
      await page.waitForSelector('html[data-theme="dark"]');
      await page.reload();
      await page.waitForSelector('html[data-theme="dark"]');
      const changed = structuredClone(before);
      changed.local["ln-theme"] = "dark";
      changed.db.kv.find((row) => row.key === "prefs").value.theme = "dark";
      assert.deepEqual(await snapshotProfile(page), changed);
      await page.getByRole("radio").first().click();
      await page.waitForSelector('html[data-theme="light"]');
    } else if (name === "GrammarPage") {
      const search = main.getByRole("searchbox");
      await btn("Words").click();
      await save();
      await search.fill("noun");
      await save();
      await search.fill("qqqzzzzz");
      await main.getByText("No topics found").waitFor();
      await save();
      await search.fill("");
      await btn("All").click();
      await save();
    } else if (name === "LearnPage") {
      await main.getByText(/88%/).waitFor();
      await save();
      await btn("A1").click();
      await save();
      await main.getByRole("button", { name: /^B1 / }).click();
      await save();
      await page.goto(base + "/learn#a1-u5");
      await save();
      await page.reload();
      await main.locator("#a1-u5").waitFor();
      await save();
    } else if (name === "ConversationList") {
      await main.getByText("Practised", { exact: true }).waitFor();
      await save();
      for (const category of ["Travel", "Social", "All"]) {
        await btn(category).click();
        await save();
      }
    } else {
      await main.locator('svg[aria-label^="Bar chart"]').waitFor();
      await save();
      const bar = main.locator("svg g[tabindex]").last();
      await bar.focus();
      await main.getByRole("status").waitFor();
      await save();
      await btn("Show as table").click();
      assert.equal(await main.locator("tbody tr").count(), 14);
      await save();
      await btn("Show chart").click();
      await save();
    }
    await ctx.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine);
    if (name !== "Landing")
      await page.getByText(/^You are offline\. Lessons/).waitFor();
    if (name === "ProgressPage") await btn("Show as table").click();
    if (name === "GrammarPage") await btn("Sentences").click();
    await save();
    assert.deepEqual(await snapshotProfile(page), before);
    assert.deepEqual(errors, []);
    assert.deepEqual(api, []);
    return { states, api, schema: before.schema };
  } finally {
    await ctx.close();
  }
}
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
try {
  const selected = process.argv.slice(2);
  for (const name of selected.length ? selected : Object.keys(routes)) {
    assert.ok(Object.hasOwn(routes, name), "Unknown page: " + name);
    const live = await check(
      browser,
      process.env.REFERENCE_URL ??
        "https://englishy.assistant-service.workers.dev",
      name,
    );
    const local = await check(
      browser,
      process.env.FRONTEND_URL ?? "http://127.0.0.1:4173",
      name,
    );
    assert.deepEqual(local, live, name);
    console.log(
      name,
      live.states.length,
      "matching interaction states; saved profile preserved",
    );
  }
} finally {
  await browser.close();
}
