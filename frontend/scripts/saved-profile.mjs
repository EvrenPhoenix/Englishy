// A synthetic existing learner. The literal identifiers and rows freeze the recovered release format.
// Call only with a fresh, disposable Playwright browser context.
export async function seedSavedProfile(
  page,
  base,
  color = "light",
  locale = "en",
) {
  await page.clock.setFixedTime(new Date("2026-11-24T12:00:00Z"));
  await page.goto(base + "/guides/learn-english-for-beginners");
  await page.waitForFunction(async () =>
    (await indexedDB.databases()).some(
      (db) => db.name === "linguanest" && db.version === 2,
    ),
  );
  await page.route("**/__fixture_setup__", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: "<link rel=icon href=data:,>",
    }),
  );
  await page.goto(base + "/__fixture_setup__");
  await page.evaluate(
    async ({ color, locale }) => {
      const db = await new Promise((ok, fail) => {
        const r = indexedDB.open("linguanest");
        r.onsuccess = () => ok(r.result);
        r.onerror = () => fail(r.error);
      });
      const at = "2026-11-24T10:00:00.000Z",
        day = at.slice(0, 10);
      const tx = db.transaction([...db.objectStoreNames], "readwrite");
      const prefs = {
        uiLanguage: locale,
        nativeLanguage: locale,
        explanationLanguage: locale,
        level: "pre-a1",
        goals: ["travel"],
        variety: "british",
        dailyGoalMinutes: 15,
        theme: color,
        textSize: "normal",
        reducedMotion: false,
        speechRate: 0.9,
        voiceURI: null,
        correctionMode: "major",
        saveConversations: true,
        streaksEnabled: true,
        showTranslations: "auto",
        onboarding: { completed: true, step: 7, placementTaken: true },
        createdAt: "2025-02-01T00:00:00.000Z",
      };
      tx.objectStore("kv").put(prefs, "prefs");
      for (const [lessonId, status, bestScore] of [
        ["pa1-alphabet", "completed", 0.875],
        ["pa1-sounds", "started", 0],
      ])
        tx.objectStore("lessons").put({
          lessonId,
          status,
          bestScore,
          attempts: 1,
          startedAt: at,
          completedAt: status === "completed" ? at : null,
        });
      for (const [i, type, durationSec, xp] of [
        [1, "lesson", 480, 24],
        [2, "conversation", 120, 8],
        [3, "writing", 180, 10],
      ])
        tx.objectStore("activities").put({
          id: "a" + i,
          type,
          durationSec,
          xp,
          day: i === 1 ? day : "2026-11-23",
          at,
          refId: "pa1-alphabet",
        });
      for (const [id, interval] of [
        ["cat", 21],
        ["dog", 1],
      ])
        tx.objectStore("vocab").put({
          id: "bank:" + id,
          word: id,
          definition: id,
          examples: [],
          source: "bank",
          createdAt: at,
          srs: {
            ease: 2.5,
            interval,
            reps: 2,
            lapses: 0,
            due: at,
            lastReviewed: at,
          },
        });
      for (const kind of ["tutor", "scenario"])
        tx.objectStore("conversations").put({
          id: kind,
          kind,
          title: "Saved " + kind,
          createdAt: at,
          updatedAt: at,
          messages: [],
          ...(kind === "scenario"
            ? {
                scenarioId: "introduce-yourself",
                report: { summary: "Introductions practised" },
              }
            : {}),
        });
      for (let i = 0; i < 3; i++)
        tx.objectStore("results").put({
          id: "result" + i,
          at,
          lessonId: "pa1-sounds",
          exerciseId: "pa1-sounds:" + (i + 1),
          correct: i === 2,
        });
      await new Promise((ok, fail) => {
        tx.oncomplete = ok;
        tx.onerror = () => fail(tx.error);
      });
      db.close();
      for (const [key, v] of Object.entries({
        "ln-theme": color,
        "ln-sidebar": "open",
        "ln-writing-draft": "My saved draft",
        "ln-mic-consent": "yes",
        "ln-lesson-draft:pa1-sounds": JSON.stringify({
          version: 1,
          index: 0,
          exerciseIds: Array.from(
            { length: 9 },
            (_, i) => "pa1-sounds:" + (i + 1),
          ).join("|"),
          outcomes: {},
        }),
      }))
        localStorage.setItem(key, v);
    },
    { color, locale },
  );
}
export async function snapshotProfile(page) {
  return page.evaluate(async () => {
    const db = await new Promise((ok, fail) => {
      const r = indexedDB.open("linguanest");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    const schema = { name: db.name, version: db.version, stores: {} };
    const result = {};
    for (const name of db.objectStoreNames) {
      const store = db.transaction(name).objectStore(name);
      schema.stores[name] = {
        keyPath: store.keyPath,
        autoIncrement: store.autoIncrement,
        indexes: [...store.indexNames].map((name) => {
          const index = store.index(name);
          return {
            name,
            keyPath: index.keyPath,
            unique: index.unique,
            multiEntry: index.multiEntry,
          };
        }),
      };
      const req = (r) =>
        new Promise((ok, fail) => {
          r.onsuccess = () => ok(r.result);
          r.onerror = () => fail(r.error);
        });
      const [keys, values] = await Promise.all([
        req(store.getAllKeys()),
        req(store.getAll()),
      ]);
      result[name] = keys.map((key, index) => ({ key, value: values[index] }));
    }
    db.close();
    return { schema, db: result, local: { ...localStorage } };
  });
}
