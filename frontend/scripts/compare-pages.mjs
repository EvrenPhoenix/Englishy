// Screenshot parity between the compiled reference (served by `wrangler dev`) and the
// rebuilt frontend (served by `vite preview`). Usage:
//   node scripts/compare-pages.mjs <name>[,<name>...] [--out dir]
// Env: REF_BASE (default http://127.0.0.1:8787), NEW_BASE (default http://127.0.0.1:4173)
// Every capture seeds the same saved profile, freezes time, disables animations,
// blocks service workers and answers /api/* from fixtures, so no live AI is called.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { seedSavedProfile } from "./saved-profile.mjs";
import { pages } from "./compare-routes.mjs";
import { mockApi } from "./api-fixtures.mjs";

const REF = process.env.REF_BASE ?? "http://127.0.0.1:8787";
const NEW = process.env.NEW_BASE ?? "http://127.0.0.1:4173";
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : "/tmp/englishy-compare";
const names = (args[0] ?? Object.keys(pages).join(",")).split(",");
mkdirSync(out, { recursive: true });

const variants = [
  { w: 1280, h: 900, color: "light", locale: "en" },
  { w: 1280, h: 900, color: "dark", locale: "en" },
  { w: 390, h: 844, color: "light", locale: "en" },
  { w: 390, h: 844, color: "dark", locale: "en" },
  { w: 390, h: 844, color: "light", locale: "ar" },
];

// VARIANTS=0,2 limits captures to those variant indexes (default: all five).
const only = process.env.VARIANTS?.split(",").map(Number);
const activeVariants = only
  ? variants.filter((_, i) => only.includes(i))
  : variants;

const NO_MOTION = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}`;

async function capture(browser, base, page, v, attempt = 0) {
  try {
    return await captureOnce(browser, base, page, v);
  } catch (error) {
    // Seeding occasionally races the app's own database upgrade; retry once.
    if (attempt >= 1) throw error;
    return capture(browser, base, page, v, attempt + 1);
  }
}

async function captureOnce(browser, base, page, v) {
  const ctx = await browser.newContext({
    viewport: { width: v.w, height: v.h },
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
    colorScheme: v.color,
    reducedMotion: "reduce",
    permissions: [],
  });
  const tab = await ctx.newPage();
  const errors = [];
  const api = [];
  tab.on("pageerror", (e) => errors.push(String(e)));
  // The Worker sends a Content-Security-Policy header and vite preview does not, so
  // CSP violation reports (blocked inline handlers) only appear on the reference.
  tab.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !m.text().includes("Content Security Policy") &&
      errors.push(m.text()),
  );
  await mockApi(tab, api, page.api ?? {});
  if (page.init) await tab.addInitScript(page.init);
  await seedSavedProfile(tab, base, v.color, v.locale);
  if (page.seed) await page.seed(tab, base);
  await tab.goto(base + page.path);
  await tab.addStyleTag({ content: NO_MOTION });
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForLoadState("networkidle");
  if (page.ready) await page.ready(tab);
  if (page.act) await page.act(tab);
  await tab.waitForLoadState("networkidle");
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForTimeout(150);
  const png = await tab.screenshot({ fullPage: !page.viewportOnly });
  const text = await tab.locator("body").innerText();
  const title = await tab.title();
  const dir = await tab.evaluate(() => document.documentElement.dir);
  await ctx.close();
  return { png, text, title, dir, errors, api };
}

async function diff(browser, a, b) {
  const ctx = await browser.newContext();
  const tab = await ctx.newPage();
  const res = await tab.evaluate(
    async ([a, b]) => {
      const load = (s) =>
        new Promise((ok) => {
          const i = new Image();
          i.onload = () => ok(i);
          i.src = "data:image/png;base64," + s;
        });
      const [x, y] = await Promise.all([load(a), load(b)]);
      if (x.width !== y.width || x.height !== y.height)
        return { size: [x.width, x.height, y.width, y.height], pixels: -1 };
      const c = new OffscreenCanvas(x.width, x.height).getContext("2d");
      c.drawImage(x, 0, 0);
      const da = c.getImageData(0, 0, x.width, x.height).data;
      c.clearRect(0, 0, x.width, x.height);
      c.drawImage(y, 0, 0);
      const db = c.getImageData(0, 0, x.width, x.height).data;
      let n = 0;
      for (let i = 0; i < da.length; i += 4)
        if (
          da[i] !== db[i] ||
          da[i + 1] !== db[i + 1] ||
          da[i + 2] !== db[i + 2]
        )
          n++;
      return { size: [x.width, x.height], pixels: n };
    },
    [a.toString("base64"), b.toString("base64")],
  );
  await ctx.close();
  return res;
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
let failed = 0;
for (const name of names) {
  const page = pages[name];
  if (!page) throw new Error("Unknown page " + name);
  for (const v of activeVariants) {
    const tag = `${name}-${v.w}-${v.color}-${v.locale}`;
    let [ref, neu] = await Promise.all([
      capture(browser, REF, page, v),
      capture(browser, NEW, page, v),
    ]);
    let d = await diff(browser, ref.png, neu.png);
    if (d.pixels !== 0) {
      // Backdrop blur is rasterised non-deterministically; recapture once before failing.
      [ref, neu] = await Promise.all([
        capture(browser, REF, page, v),
        capture(browser, NEW, page, v),
      ]);
      d = await diff(browser, ref.png, neu.png);
    }
    const sameText = ref.text === neu.text;
    const sameApi = JSON.stringify(ref.api) === JSON.stringify(neu.api);
    const ok =
      d.pixels === 0 &&
      sameText &&
      ref.title === neu.title &&
      ref.dir === neu.dir &&
      sameApi &&
      // Errors are fine only when both builds report exactly the same ones
      // (for example a mocked 429 response logged by the browser).
      JSON.stringify(ref.errors) === JSON.stringify(neu.errors);
    if (!ok) {
      failed++;
      writeFileSync(`${out}/${tag}-ref.png`, ref.png);
      writeFileSync(`${out}/${tag}-new.png`, neu.png);
      if (!sameText) {
        writeFileSync(`${out}/${tag}-ref.txt`, ref.text);
        writeFileSync(`${out}/${tag}-new.txt`, neu.text);
      }
    }
    console.log(
      `${ok ? "PASS" : "FAIL"} ${tag} pixels=${d.pixels}${d.pixels < 0 ? " size=" + d.size : ""}` +
        `${sameText ? "" : " TEXT"}${ref.title === neu.title ? "" : " TITLE"}` +
        `${ref.dir === neu.dir ? "" : " DIR"}${sameApi ? "" : " API"}` +
        `${neu.errors.length ? " ERR:" + neu.errors.join("|").slice(0, 200) : ""}` +
        `${ref.errors.length ? " REFERR:" + ref.errors.join("|").slice(0, 200) : ""}`,
    );
    if (!ok && process.env.SHOW_API)
      console.log("  api", JSON.stringify(neu.api).slice(0, 800));
    if (!sameApi)
      console.log(
        "  ref api",
        JSON.stringify(ref.api),
        "\n  new api",
        JSON.stringify(neu.api),
      );
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
