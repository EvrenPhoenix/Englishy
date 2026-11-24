// Runs the same Settings data actions on the compiled reference and the rebuild and
// asserts the resulting IndexedDB + localStorage snapshots are identical.
// Usage: node scripts/check-settings-data.mjs [--expect-merge-fix]
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { seedSavedProfile, snapshotProfile } from "./saved-profile.mjs";
import { mockApi } from "./api-fixtures.mjs";

const REF = process.env.REF_BASE ?? "http://127.0.0.1:8787";
const NEW = process.env.NEW_BASE ?? "http://127.0.0.1:4173";
const mergeFixed = process.argv.includes("--expect-merge-fix");

const lesson = (o) => ({
  lessonId: "pa1-alphabet",
  status: "completed",
  attempts: 2,
  bestScore: 1,
  lastScore: 1,
  startedAt: "2026-11-19T09:00:00.000Z",
  completedAt: "2026-11-20T09:00:00.000Z",
  updatedAt: "2026-11-20T09:00:00.000Z",
  ...o,
});
const backup = (lessons, extra = {}) =>
  JSON.stringify({
    format: "linguanest-progress",
    version: 1,
    exportedAt: "2026-11-20T09:00:00.000Z",
    data: {
      prefs: { level: "a1", theme: "dark" },
      lessons,
      activities: [
        {
          id: "a1",
          type: "lesson",
          at: "2026-11-20T09:00:00.000Z",
          day: "2026-11-20",
          durationSec: 60,
          xp: 5,
          title: "dup",
        },
        {
          id: "b9",
          type: "review",
          at: "2026-11-20T09:00:00.000Z",
          day: "2026-11-20",
          durationSec: 60,
          xp: 5,
          title: "new",
        },
      ],
      results: [
        {
          id: "r9",
          lessonId: "pa1-alphabet",
          exerciseId: "pa1-alphabet:1",
          skill: "reading",
          at: "2026-11-20T09:00:00.000Z",
          correct: true,
        },
      ],
      vocab: [
        {
          id: "bank:cat",
          word: "cat",
          pos: "noun",
          definition: "cat",
          examples: [],
          level: "pre-a1",
          topic: "animals",
          custom: false,
          savedAt: "2026-11-20T09:00:00.000Z",
          srs: {
            ease: 2.5,
            interval: 3,
            reps: 3,
            lapses: 0,
            due: "2026-11-23T09:00:00.000Z",
            lastReviewed: "2026-11-25T09:00:00.000Z",
          },
        },
      ],
      conversations: [
        {
          id: "c9",
          kind: "tutor",
          title: "Imported",
          messages: [],
          createdAt: "2026-11-20T09:00:00.000Z",
          updatedAt: "2026-11-20T09:00:00.000Z",
        },
      ],
      ...extra,
    },
  });

const scenarios = {
  // Lesson rows: newer local attempt vs older higher-scoring backup (the reported bug),
  // plus a lesson that only exists in the backup.
  merge: {
    file: backup([
      lesson({}),
      lesson({
        lessonId: "pa1-numbers",
        status: "started",
        completedAt: null,
        bestScore: 0.5,
        lastScore: 0.5,
      }),
    ]),
    run: async (p) => {
      await p
        .getByRole("button", { name: "Add to my progress (safe)" })
        .click();
      await p.getByText(/Added or updated/).waitFor();
    },
  },
  replace: {
    file: backup([lesson({})]),
    run: async (p) => {
      await p.getByRole("button", { name: "Replace my progress" }).click();
      await p
        .locator("dialog[open]")
        .getByRole("button", { name: "Replace", exact: true })
        .click();
      await p.getByText(/Added or updated/).waitFor();
    },
  },
  clear: {
    run: async (p) => {
      await p.locator('main button[class*="-ms-3"]').click();
      await p.locator("dialog[open] button.bg-danger").click();
      await p
        .getByText("All learning data was deleted from this device.")
        .waitFor();
    },
  },
  "stop-saving-chats": {
    run: async (p) => {
      await p.locator("#s-tutor + div").getByRole("switch").click();
      await p.waitForTimeout(300);
    },
  },
  preferences: {
    run: async (p) => {
      await p.getByRole("radio", { name: "20 min" }).click();
      await p.getByRole("button", { name: /Work/ }).click();
      await p.getByRole("radio", { name: "Large", exact: true }).click();
      await p.locator("main summary").click();
      await p.locator("main select").nth(2).selectOption("hi");
      await p.waitForTimeout(300);
    },
  },
};

async function run(browser, base, name) {
  const ctx = await browser.newContext({
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await mockApi(page, []);
  await seedSavedProfile(page, base);
  // Give the seeded alphabet lesson a newer, lower-scoring latest attempt.
  await page.evaluate(async () => {
    const db = await new Promise((ok) => {
      const r = indexedDB.open("linguanest");
      r.onsuccess = () => ok(r.result);
    });
    const tx = db.transaction("lessons", "readwrite");
    tx.objectStore("lessons").put({
      lessonId: "pa1-alphabet",
      status: "completed",
      attempts: 4,
      bestScore: 0.875,
      lastScore: 0.75,
      startedAt: "2026-11-18T09:00:00.000Z",
      completedAt: "2026-11-21T09:00:00.000Z",
      updatedAt: "2026-11-24T09:00:00.000Z",
    });
    await new Promise((ok) => (tx.oncomplete = ok));
    db.close();
  });
  await page.goto(base + "/settings");
  await page.locator("main h1").waitFor();
  const s = scenarios[name];
  if (s.file)
    await page.locator('input[type="file"]').setInputFiles({
      name: "b.json",
      mimeType: "application/json",
      buffer: Buffer.from(s.file),
    });
  await s.run(page);
  const snap = await snapshotProfile(page);
  await ctx.close();
  assert.deepEqual(errors, [], `${base} ${name} page errors`);
  return snap;
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
let failed = 0;
for (const name of Object.keys(scenarios)) {
  const [ref, neu] = await Promise.all([
    run(browser, REF, name),
    run(browser, NEW, name),
  ]);
  if (name === "merge" && mergeFixed) {
    const pick = (s) =>
      s.db.lessons.find((r) => r.key === "pa1-alphabet").value;
    const a = pick(ref),
      b = pick(neu);
    // Reference still shows the bug: the older backup attempt overwrites the newer one.
    assert.equal(a.lastScore, 1);
    assert.equal(a.updatedAt, "2026-11-20T09:00:00.000Z");
    // Rebuild keeps the higher best, and the newer attempt's score + date together.
    assert.equal(b.bestScore, 1);
    assert.equal(b.lastScore, 0.75);
    assert.equal(b.updatedAt, "2026-11-24T09:00:00.000Z");
    assert.equal(b.attempts, 4);
    // Everything else must still match the reference.
    const strip = (s) => ({
      ...s,
      db: {
        ...s.db,
        lessons: s.db.lessons.filter((r) => r.key !== "pa1-alphabet"),
      },
    });
    assert.deepEqual(strip(neu), strip(ref));
    console.log("PASS merge (with intentional fix)");
    continue;
  }
  try {
    assert.deepEqual(neu, ref);
    console.log("PASS", name);
  } catch (e) {
    failed++;
    console.log("FAIL", name, e.message.slice(0, 1500));
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
