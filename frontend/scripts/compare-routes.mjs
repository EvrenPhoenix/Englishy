// Page definitions for compare-pages.mjs. `api` overrides mocked endpoints,
// `ready` waits for page content, `act` drives an interaction before capture.
const h1 = (p) => p.locator("main h1").waitFor();

// A small valid backup used to reach the "Ready to restore" state.
const backup = JSON.stringify({
  format: "linguanest-progress",
  version: 1,
  exportedAt: "2026-11-20T09:00:00.000Z",
  data: {
    prefs: null,
    lessons: [
      {
        lessonId: "pa1-alphabet",
        status: "completed",
        attempts: 2,
        bestScore: 1,
        lastScore: 1,
        startedAt: "2026-11-19T09:00:00.000Z",
        completedAt: "2026-11-20T09:00:00.000Z",
        updatedAt: "2026-11-20T09:00:00.000Z",
      },
    ],
    activities: [],
    results: [],
    vocab: [],
    conversations: [],
  },
});
const upload = (p, body) =>
  p.locator('input[type="file"]').setInputFiles({
    name: "englishy-progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(body),
  });

// Placement helpers use structure rather than text so Arabic captures work too.
const placementStart = (p) => p.locator("main button").first().click();
const answers = 'main [role=radiogroup]:not([aria-label="Playback speed"])';
const pick = (p, n) =>
  p
    .locator(answers + " button")
    .nth(n)
    .click();
const check = (p) => p.locator(answers + " + button").click();
const next = (p) =>
  p.locator('main [aria-live=polite] button[class*="min-w-40"]').click();
const answerMc = async (p, n) => {
  await pick(p, n);
  await check(p);
  await next(p);
};
const writingFeedback = {
  json: {
    summary: "Clear and friendly. A few small grammar slips.",
    strengths: ["Good sentence variety", "Clear plans"],
    corrected:
      "I am Ana. I live in Lisbon and I want to study nursing next year.",
    issues: [
      {
        original: "I living",
        suggestion: "I live",
        category: "grammar",
        explanation: "Use the present simple for facts.",
        optional: false,
      },
      {
        original: "want study",
        suggestion: "want to study",
        category: "grammar",
        explanation: "Want is followed by to + verb.",
        optional: false,
      },
      {
        original: "next year",
        suggestion: "in the coming year",
        category: "style",
        explanation: "Optional alternative.",
        optional: true,
      },
    ],
  },
};

// The base fixture's vocab rows predate several fields; give vocabulary tests complete
// notebook records (two bank words and one custom word). With `oneDue`, only cat is due.
const realWords = (oneDue) => async (p) => {
  await p.evaluate(async (oneDue) => {
    const db = await new Promise((ok) => {
      const r = indexedDB.open("linguanest");
      r.onsuccess = () => ok(r.result);
    });
    const at = "2026-11-24T10:00:00.000Z";
    const srs = (interval, due, reviewed = at) => ({
      ease: 2.5,
      interval,
      reps: 2,
      lapses: 0,
      due,
      lastReviewed: reviewed,
    });
    const tx = db.transaction("vocab", "readwrite");
    const store = tx.objectStore("vocab");
    store.clear();
    store.put({
      id: "bank:cat",
      word: "cat",
      pos: "noun",
      definition: "a small animal with fur that people keep as a pet",
      translation: undefined,
      ipa: "/kæt/",
      examples: ["My cat sleeps a lot."],
      collocations: ["pet cat"],
      synonyms: ["kitty"],
      level: "pre-a1",
      topic: "animals",
      custom: false,
      savedAt: at,
      srs: srs(21, at),
    });
    store.put({
      id: "bank:dog",
      word: "dog",
      pos: "noun",
      definition: "an animal that people keep as a pet or to guard a house",
      ipa: "/dɒɡ/",
      examples: ["The dog is in the garden."],
      antonyms: ["cat"],
      level: "pre-a1",
      topic: "animals",
      custom: false,
      savedAt: at,
      srs: srs(1, oneDue ? "2026-12-30T00:00:00.000Z" : at),
    });
    store.put({
      id: "custom:kettle",
      word: "kettle",
      pos: "noun",
      definition: "a pot for boiling water",
      translation: "chaleira",
      examples: [],
      level: "a1",
      topic: "custom",
      custom: true,
      savedAt: at,
      srs: {
        ease: 2.5,
        interval: 0,
        reps: 0,
        lapses: 0,
        due: "2026-12-01T00:00:00.000Z",
        lastReviewed: null,
      },
    });
    await new Promise((ok) => (tx.oncomplete = ok));
    db.close();
  }, oneDue);
};

export const pages = {
  NotFound: {
    path: "/no-such-page",
    ready: (p) => p.locator("main .border-dashed").waitFor(),
  },
  Help: { path: "/help", ready: h1 },
  Guide: {
    path: "/guides/learn-english-for-beginners",
    ready: (p) => p.locator("h1").first().waitFor(),
  },
  Landing: { path: "/", ready: (p) => p.locator("h1").first().waitFor() },
  GrammarPage: { path: "/grammar", ready: h1 },
  LearnPage: {
    path: "/learn",
    ready: (p) => p.getByText(/88%/).first().waitFor(),
  },
  ConversationList: { path: "/conversation", ready: h1 },
  ProgressPage: { path: "/progress", ready: h1 },
  Dashboard: {
    path: "/home",
    ready: (p) => p.locator("main textarea").waitFor(),
    // Type and clear once so the auto-sized textarea measures with the loaded font.
    act: async (p) => {
      await p.locator("main textarea").fill("x");
      await p.locator("main textarea").fill("");
    },
  },
  Onboarding: {
    path: "/start",
    ready: (p) => p.locator("h1").first().waitFor(),
  },
  Settings: { path: "/settings", ready: h1 },
  "Settings-more": {
    path: "/settings",
    ready: h1,
    act: (p) => p.locator("main summary").click(),
  },
  "Settings-restore": {
    path: "/settings",
    ready: h1,
    act: async (p) => {
      await upload(p, backup);
      await p.getByText("Ready to restore").waitFor();
    },
  },
  "Settings-merged": {
    path: "/settings",
    ready: h1,
    act: async (p) => {
      await upload(p, backup);
      await p
        .getByRole("button", { name: "Add to my progress (safe)" })
        .click();
      await p.getByText(/Added or updated/).waitFor();
    },
  },
  "Settings-bad-file": {
    path: "/settings",
    ready: h1,
    act: async (p) => {
      await upload(p, '{"format":"linguanest-progress","version":9}');
      await p.getByRole("alert").waitFor();
    },
  },
  "Settings-clear-dialog": {
    path: "/settings",
    ready: h1,
    viewportOnly: true,
    act: async (p) => {
      await p.locator('main button[class*="-ms-3"]').click();
      await p.locator("dialog[open]").waitFor();
    },
  },
  Placement: { path: "/placement", ready: (p) => p.locator("h1").waitFor() },
  "Placement-question": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    act: placementStart,
  },
  "Placement-correct": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    act: async (p) => {
      await placementStart(p);
      await pick(p, 0);
      await check(p);
    },
  },
  "Placement-wrong": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    api: { explain: { sse: ["When you meet ", "someone, say Hello."] } },
    act: async (p) => {
      await placementStart(p);
      await pick(p, 1);
      await check(p);
      await p.locator("main [aria-live=polite] .mt-2 button").click();
      await p.locator("main [aria-live=polite] .whitespace-pre-wrap").waitFor();
    },
  },
  "Placement-listen": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    act: async (p) => {
      await placementStart(p);
      await answerMc(p, 0);
      await answerMc(p, 1);
      await answerMc(p, 0);
      await p
        .locator('main [role=radiogroup][aria-label="Playback speed"]')
        .waitFor();
    },
  },
  "Placement-stage2": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    act: async (p) => {
      await placementStart(p);
      for (const n of [0, 1, 0, 0, 1, 0, 0]) await answerMc(p, n);
    },
  },
  "Placement-result": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    act: async (p) => {
      await placementStart(p);
      for (const n of [0, 1, 0, 0, 1, 0]) await answerMc(p, n);
      await p.locator("header button").click();
      await p.locator("main textarea").waitFor();
    },
  },
  "Placement-feedback": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    api: { writing: writingFeedback },
    act: async (p) => {
      await placementStart(p);
      await answerMc(p, 2);
      await p.locator("header button").click();
      await p
        .locator("main textarea")
        .fill(
          "I am Ana and I living in Lisbon. I want study nursing next year.",
        );
      await p.locator("main textarea + button").click();
      await p.locator("main .rounded-xl.bg-surface-2").waitFor();
    },
  },
  // Data-only flow: finish placement and save the chosen level.
  "Placement-save": {
    path: "/placement",
    ready: (p) => p.locator("h1").waitFor(),
    act: async (p) => {
      await placementStart(p);
      for (const n of [0, 1, 0, 0, 1, 0, 0]) await answerMc(p, n);
      await p.locator("header button").click();
      await p.locator("main select").selectOption("a2");
      await p.locator("main .card:has(select) > button").click();
      await p.waitForURL(/\/home$/);
    },
  },
  GrammarTopic: { path: "/grammar/present-simple", ready: h1 },
  "GrammarTopic-details": {
    path: "/grammar/articles",
    ready: h1,
    act: (p) => p.locator("main button[aria-expanded]").click(),
  },
  "GrammarTopic-practice": {
    path: "/grammar/present-simple",
    ready: h1,
    act: (p) => p.locator("#practice-h + button").click(),
  },
  "GrammarTopic-answered": {
    path: "/grammar/articles",
    ready: h1,
    act: async (p) => {
      await p.locator("#practice-h + button").click();
      const card = p.locator("main section .card");
      await card.locator("button, input").first().waitFor();
      const input = card.locator("input");
      if (await input.count()) {
        await input.fill("wrong answer");
        await input.press("Enter");
      } else {
        await pick(p, 0);
        await check(p);
      }
      await p.locator("main [aria-live=polite][role=status]").last().waitFor();
    },
  },
  "GrammarTopic-missing": {
    path: "/grammar/no-such-topic",
    ready: (p) => p.locator("main .border-dashed").waitFor(),
  },
};
Object.assign(pages, {
  "Vocabulary-broken-data": { path: "/vocabulary", ready: h1 },
  Vocabulary: { path: "/vocabulary", ready: h1, seed: realWords(false) },
  "Vocabulary-search": {
    seed: realWords(false),
    path: "/vocabulary",
    ready: h1,
    act: (p) => p.locator("main input[type=search]").fill("do"),
  },
  "Vocabulary-add-dialog": {
    seed: realWords(false),
    path: "/vocabulary",
    ready: h1,
    viewportOnly: true,
    act: async (p) => {
      await p.locator("main .sm\\:flex-row button").first().click();
      await p.locator("dialog[open] input").first().fill("kettle");
    },
  },
  "Vocabulary-remove-dialog": {
    seed: realWords(false),
    path: "/vocabulary",
    ready: h1,
    viewportOnly: true,
    act: (p) =>
      p.locator('main li button[aria-label^="Remove"]').first().click(),
  },
  "Vocabulary-browse": {
    path: "/vocabulary?tab=browse",
    ready: h1,
    seed: realWords(false),
  },
  "Vocabulary-browse-topic": {
    seed: realWords(false),
    path: "/vocabulary?tab=browse",
    ready: h1,
    act: (p) => p.locator("main [role=group] button").nth(3).click(),
  },
  "Vocabulary-browse-search": {
    seed: realWords(false),
    path: "/vocabulary?tab=browse",
    ready: h1,
    act: (p) => p.locator("main input[type=search]").fill("food"),
  },
  "Vocabulary-save": {
    seed: realWords(false),
    path: "/vocabulary?tab=browse",
    ready: h1,
    act: async (p) => {
      await p.locator("main li button.self-start").nth(2).click();
      await p
        .locator("main li")
        .nth(2)
        .locator("button.self-start[disabled]")
        .waitFor();
    },
  },
  "Vocabulary-review": {
    path: "/vocabulary?review=1",
    ready: h1,
    seed: realWords(false),
  },
  "Vocabulary-recall": {
    path: "/vocabulary?review=1",
    ready: h1,
    // One word due so the shuffled queue is deterministic.
    seed: realWords(true),
    act: async (p) => {
      await p.locator("main .card-hover").nth(1).click();
      await p.locator("#recall").fill("caat");
      await p.locator("#recall").press("Enter");
      await p.locator("main [role=status]").waitFor();
    },
  },
  "Vocabulary-cards": {
    path: "/vocabulary?review=1",
    ready: h1,
    seed: realWords(true),
    act: async (p) => {
      await p.locator("main .card-hover").first().click();
      await p.locator("main button.w-full").click();
    },
  },
  "Vocabulary-done": {
    path: "/vocabulary?review=1",
    ready: h1,
    seed: realWords(true),
    act: async (p) => {
      await p.locator("main .card-hover").first().click();
      await p.locator("main button.w-full").click();
      await p.locator("main .grid-cols-4 button").nth(2).click();
      await p.locator("main .card .text-xl").waitFor();
    },
  },
});

// Data-only vocabulary flows (check-flow-data.mjs).
Object.assign(pages, {
  "Vocabulary-add-save": {
    path: "/vocabulary",
    ready: h1,
    seed: realWords(false),
    act: async (p) => {
      await p.locator("main .sm\\:flex-row button").first().click();
      const inputs = p.locator("dialog[open] input");
      await inputs.nth(0).fill("  teapot ");
      await p.locator("dialog[open] select").selectOption("noun");
      await inputs.nth(1).fill("a pot for making tea");
      await inputs.nth(2).fill("bule");
      await inputs.nth(3).fill("The teapot is hot.");
      await p
        .locator("dialog[open] footer, dialog[open] .justify-end button")
        .last()
        .click();
      await p
        .locator("dialog[open]")
        .waitFor({ state: "detached" })
        .catch(() => {});
    },
  },
  "Vocabulary-remove-confirm": {
    path: "/vocabulary",
    ready: h1,
    seed: realWords(false),
    act: async (p) => {
      await p.locator('main li button[aria-label^="Remove"]').first().click();
      await p.locator("dialog[open] .justify-end button").last().click();
    },
  },
  "Vocabulary-grade-hard": {
    path: "/vocabulary?review=1",
    ready: h1,
    seed: realWords(true),
    act: async (p) => {
      await p.locator("main .card-hover").nth(1).click();
      await p.locator("#recall").fill("caat");
      await p.locator("#recall").press("Enter");
      await p.locator("main .grid-cols-4 button").nth(1).click();
      await p.locator("main .card .text-xl").waitFor();
    },
  },
  "Vocabulary-grade-again-then-easy": {
    path: "/vocabulary?review=1",
    ready: h1,
    seed: realWords(true),
    act: async (p) => {
      await p.locator("main .card-hover").first().click();
      await p.keyboard.press("Space");
      await p.keyboard.press("1");
      await p.keyboard.press("Enter");
      await p.keyboard.press("4");
      await p.locator("main .card .text-xl").waitFor();
    },
  },
});

const writingReply = {
  json: {
    summary: "A friendly message with a few small mistakes.",
    corrected:
      "Hi Sam, I am going to the market tomorrow. Do you want to come with me? We can buy some fruit.",
    improved:
      "Hi Sam! I'm heading to the market tomorrow. Would you like to join me? We could pick up some fruit.",
    strengths: ["Clear purpose", "Friendly tone"],
    issues: [
      {
        original: "I going",
        suggestion: "I am going",
        category: "grammar",
        explanation: "Use am + -ing for plans.",
        optional: false,
      },
      {
        original: "Do you wants",
        suggestion: "Do you want",
        category: "grammar",
        explanation: "After do, use the base verb.",
        optional: false,
      },
      {
        original: "fruits",
        suggestion: "fruit",
        category: "vocabulary",
        explanation: "Fruit is usually uncountable.",
        optional: true,
      },
      {
        original: "can buy",
        suggestion: "could pick up",
        category: "style",
        explanation: "Sounds more natural.",
        optional: true,
      },
      {
        original: "not in the text",
        suggestion: "x",
        category: "spelling",
        explanation: "Cannot be placed.",
        optional: false,
      },
    ],
  },
};
const writingText =
  "Hi Sam, I going to the market tomorrow. Do you wants to come with me? We can buy some fruits.";
const writingFeedbackFlow = async (p) => {
  await p.locator("main textarea").fill(writingText);
  await p.locator("main fieldset button").nth(1).click();
  await p.locator("main input:not([type])").first().fill("Invite a friend");
  await p.locator("main [role=switch]").click();
  await p.locator("main .card > .flex-wrap.gap-2 > button").first().click();
  await p.locator("main h2").first().waitFor();
};
Object.assign(pages, {
  Writing: { path: "/writing", ready: h1 },
  "Writing-draft": {
    path: "/writing",
    ready: h1,
    act: async (p) => {
      await p.locator("main textarea").fill(writingText);
      await p.locator("main fieldset button").nth(5).click();
    },
  },
  "Writing-too-long": {
    path: "/writing",
    ready: h1,
    act: (p) => p.locator("main textarea").fill("word ".repeat(820)),
  },
  "Writing-ai-off": {
    path: "/writing",
    ready: h1,
    api: {
      status: { json: { enabled: false, configured: false, available: false } },
    },
  },
  "Writing-error": {
    path: "/writing",
    ready: h1,
    api: {
      writing: {
        status: 429,
        json: {
          error: {
            code: "rate_limited",
            message: "Too many requests.",
            retryAfter: 12.2,
          },
        },
      },
    },
    act: async (p) => {
      await p.locator("main textarea").fill(writingText);
      await p.locator("main .card > .flex-wrap.gap-2 > button").first().click();
      await p.locator("main [role=alert]").waitFor();
    },
  },
  "Writing-invalid": {
    path: "/writing",
    ready: h1,
    api: { writing: { json: { summary: 1 } } },
    act: async (p) => {
      await p.locator("main textarea").fill(writingText);
      await p.locator("main .card > .flex-wrap.gap-2 > button").first().click();
      await p.locator("main [role=alert]").waitFor();
    },
  },
  "Writing-feedback": {
    path: "/writing",
    ready: h1,
    api: { writing: writingReply },
    act: writingFeedbackFlow,
  },
  "Writing-feedback-interact": {
    path: "/writing",
    ready: h1,
    api: { writing: writingReply },
    act: async (p) => {
      await writingFeedbackFlow(p);
      await p.locator("main p.leading-loose button").nth(2).click();
      await p.locator("main li .mt-2.flex button").nth(2).click();
      await p.locator("main li .mt-2.flex button").first().click();
      await p.locator("main label input[type=checkbox]").uncheck();
    },
  },
  "Writing-no-issues": {
    path: "/writing",
    ready: h1,
    api: {
      writing: {
        json: {
          summary: "Perfect.",
          corrected: writingText,
          issues: [],
          strengths: [],
        },
      },
    },
    act: writingFeedbackFlow,
  },
  "Writing-edit-again": {
    path: "/writing",
    ready: h1,
    api: { writing: writingReply },
    act: async (p) => {
      await writingFeedbackFlow(p);
      await p
        .locator(
          "main > div > .flex-wrap.gap-2 > button, main .space-y-5 > .flex.flex-wrap.gap-2 > button",
        )
        .first()
        .click();
      await p.locator("main textarea").waitFor();
    },
  },
});

Object.assign(pages, {
  // Data: feedback logs a writing activity and the draft persists in localStorage.
  "Writing-save-data": {
    path: "/writing",
    ready: h1,
    api: { writing: writingReply },
    act: async (p) => {
      await writingFeedbackFlow(p);
      await p.locator("main li .mt-2.flex button").nth(2).click();
      await p
        .locator(".space-y-5 > .flex.flex-wrap.gap-2 > button")
        .first()
        .click();
      await p.locator("main textarea").waitFor();
    },
  },
});

const noSpeech = () => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
};
const startDrill = (n) => (p) => p.locator("main .card-hover").nth(n).click();
Object.assign(pages, {
  Speaking: { path: "/speaking", ready: h1 },
  "Speaking-speak": { path: "/speaking?tab=speak", ready: h1 },
  "Speaking-no-speech": { path: "/speaking", ready: h1, init: noSpeech },
  "Speaking-speak-no-speech": {
    path: "/speaking?tab=speak",
    ready: h1,
    init: noSpeech,
  },
  "Speaking-words": { path: "/speaking", ready: h1, act: startDrill(0) },
  "Speaking-complete": { path: "/speaking", ready: h1, act: startDrill(1) },
  "Speaking-dictation": { path: "/speaking", ready: h1, act: startDrill(2) },
  "Speaking-repeat": {
    path: "/speaking?tab=speak",
    ready: h1,
    act: startDrill(0),
  },
  "Speaking-read": {
    path: "/speaking?tab=speak",
    ready: h1,
    act: startDrill(1),
  },
  "Speaking-dictation-no-audio": {
    path: "/speaking",
    ready: h1,
    init: noSpeech,
    act: startDrill(2),
  },
  "Speaking-mic-consent": {
    path: "/speaking?tab=speak",
    ready: h1,
    viewportOnly: true,
    act: async (p) => {
      await startDrill(0)(p);
      await p.evaluate(() => localStorage.removeItem("ln-mic-consent"));
      await p.locator("main .card button.bg-primary").first().click();
      await p.locator("dialog[open]").waitFor();
    },
  },
  "Speaking-words-finished": {
    path: "/speaking",
    ready: h1,
    act: async (p) => {
      await startDrill(0)(p);
      for (let i = 0; i < 8; i++) await answerMc(p, i % 3);
      await p.locator("main .card .text-lg").waitFor();
    },
  },
  "Speaking-new-set": {
    path: "/speaking",
    ready: h1,
    act: async (p) => {
      await startDrill(1)(p);
      await p
        .locator("main > div > button.mt-4, main button.mt-4.text-sm")
        .last()
        .click();
    },
  },
});

// Results that make one lesson a revision topic and leave open mistakes.
const practiseResults = async (p) => {
  await p.evaluate(async () => {
    const db = await new Promise((ok) => {
      const r = indexedDB.open("linguanest");
      r.onsuccess = () => ok(r.result);
    });
    const tx = db.transaction(["results", "lessons"], "readwrite");
    const results = tx.objectStore("results");
    const rows = [
      ["pa1-alphabet:2", false],
      ["pa1-alphabet:3", false],
      ["pa1-alphabet:4", true],
      ["pa1-alphabet:5", false],
      ["g-articles:1", false],
      ["g-articles:2", false],
      ["g-articles:3", true],
    ];
    rows.forEach(([exerciseId, correct], i) =>
      results.put({
        id: "p" + i,
        at: "2026-11-24T09:0" + i + ":00.000Z",
        lessonId: exerciseId.startsWith("g-")
          ? "grammar:articles"
          : "pa1-alphabet",
        exerciseId,
        skill: "review",
        correct,
      }),
    );
    await new Promise((ok) => (tx.oncomplete = ok));
    db.close();
  });
};
const exercisesReply = {
  json: {
    exercises: [
      {
        question: "Choose the past of 'go'.",
        options: ["goed", "went", "gone"],
        answerIndex: 1,
        explanation: "Go is irregular: went.",
      },
      {
        question: "Choose the past of 'eat'.",
        options: ["ate", "eated"],
        answerIndex: 0,
        explanation: "Eat becomes ate.",
      },
      {
        question: "Bad index",
        options: ["a", "b"],
        answerIndex: 3,
        explanation: "Dropped.",
      },
    ],
  },
};
Object.assign(pages, {
  Practise: { path: "/practise", ready: h1 },
  "Practise-with-results": {
    path: "/practise",
    ready: h1,
    seed: practiseResults,
  },
  "Practise-mistakes": {
    path: "/practise",
    ready: h1,
    seed: practiseResults,
    act: (p) =>
      p.locator("main .md\\:grid-cols-2 .card button").first().click(),
  },
  "Practise-mixed": {
    path: "/practise",
    ready: h1,
    act: (p) => p.locator("main .md\\:grid-cols-2 .card button").nth(1).click(),
  },
  "Practise-ai": {
    path: "/practise",
    ready: h1,
    api: { exercises: exercisesReply },
    act: async (p) => {
      await p.locator("main form input").fill("past simple irregular verbs");
      await p.locator("main form button").click();
      await p.locator("main [role=status]").first().waitFor();
    },
  },
  "Practise-ai-invalid": {
    path: "/practise",
    ready: h1,
    api: { exercises: { json: { exercises: [] } } },
    act: async (p) => {
      await p.locator("main form input").fill("kitchen words");
      await p.locator("main form button").click();
      await p.locator("main p.text-danger").waitFor();
    },
  },
  "Practise-offline": {
    path: "/practise",
    ready: h1,
    act: async (p) => {
      await p.context().setOffline(true);
      await p.evaluate(() => window.dispatchEvent(new Event("offline")));
      await p.locator("main form + div a, main .mt-3 > a").first().waitFor();
    },
  },
  "Practise-mistakes-done": {
    path: "/practise",
    ready: h1,
    seed: practiseResults,
    act: async (p) => {
      await p.locator("main .md\\:grid-cols-2 .card button").first().click();
      for (let i = 0; i < 12; i++) {
        const done = await p
          .locator("main .card .text-lg.font-semibold")
          .count();
        if (done) break;
        await p.locator("main .card .border-t button").click();
      }
      await p.locator("main .card .text-lg.font-semibold").waitFor();
    },
  },
});

const tutorMarkdown = [
  "Great question! Here are **three** ways to introduce yourself:\n\n",
  "1. *Hello*, I'm Ana.\n2. Nice to meet you.\n3. My name is Ana.\n\n",
  "- Use `I'm` in speech\n- Read more at [the guide](https://example.com/guide) or [here](javascript:alert(1))\n\n",
  "> Tip: smile!\n\n| Phrase | Use |\n| --- | --- |\n| Hi | casual |\n\n<script>alert(1)</script><img src=x onerror=alert(1)>~~old~~ line one\nline two",
];
const savedTutorChat = async (p) => {
  await p.evaluate(async () => {
    const db = await new Promise((ok) => {
      const r = indexedDB.open("linguanest");
      r.onsuccess = () => ok(r.result);
    });
    const tx = db.transaction("conversations", "readwrite");
    tx.objectStore("conversations").put({
      id: "tutor_saved",
      kind: "tutor",
      title: "How do I say hello?",
      createdAt: "2026-11-24T09:00:00.000Z",
      updatedAt: "2026-11-24T09:05:00.000Z",
      messages: [
        {
          role: "user",
          content: "How do I say hello?",
          at: "2026-11-24T09:00:00.000Z",
        },
        {
          role: "assistant",
          content:
            "You can say **Hello** or *Hi*.\n\n- Hello, Sam!\n- Hi there!",
          at: "2026-11-24T09:00:05.000Z",
        },
        {
          role: "user",
          content: "And goodbye?",
          at: "2026-11-24T09:04:00.000Z",
        },
        {
          role: "assistant",
          content: "Say **Goodbye** or *See you*.",
          at: "2026-11-24T09:05:00.000Z",
        },
      ],
    });
    await new Promise((ok) => (tx.oncomplete = ok));
    db.close();
  });
};
const composer = "main textarea[data-composer]";
const sendMessage = async (p, text) => {
  await p.locator(composer).fill(text);
  await p.locator(composer).press("Enter");
};
const waitReply = (p) => p.locator("main .prose-tutor").last().waitFor();
Object.assign(pages, {
  Tutor: { path: "/tutor", ready: h1 },
  "Tutor-reply": {
    path: "/tutor",
    ready: h1,
    api: { tutor: { sse: tutorMarkdown } },
    act: async (p) => {
      await p.locator("main .grid button").first().click();
      await waitReply(p);
      await p.locator("main button[title]").last().waitFor();
    },
  },
  "Tutor-saved": {
    path: "/tutor?c=tutor_saved",
    ready: h1,
    seed: savedTutorChat,
    act: waitReply,
  },
  "Tutor-continue": {
    path: "/tutor?c=tutor_saved",
    ready: h1,
    seed: savedTutorChat,
    api: { tutor: { sse: ["Sure: *Bye!*"] } },
    act: async (p) => {
      await waitReply(p);
      await sendMessage(p, "Any short one?");
      await p.locator("main .prose-tutor em", { hasText: "Bye!" }).waitFor();
    },
  },
  "Tutor-regenerate": {
    path: "/tutor?c=tutor_saved",
    ready: h1,
    seed: savedTutorChat,
    api: { tutor: { sse: ["Regenerated: **See you later**."] } },
    act: async (p) => {
      await waitReply(p);
      await p.locator("main .group").last().locator("button").last().click();
      await p
        .locator("main .prose-tutor", { hasText: "Regenerated" })
        .waitFor();
    },
  },
  "Tutor-error": {
    path: "/tutor",
    ready: h1,
    api: {
      tutor: {
        status: 503,
        json: {
          error: {
            code: "upstream_unavailable",
            message: "The AI service is busy.",
          },
        },
      },
    },
    act: async (p) => {
      await sendMessage(p, "Hello?");
      await p.locator("main [role=alert]").waitFor();
    },
  },
  "Tutor-unavailable": {
    path: "/tutor",
    ready: h1,
    api: {
      status: { json: { enabled: false, configured: false, available: false } },
    },
    act: (p) => p.locator("main [role=status]").first().waitFor(),
  },
  "Tutor-not-saved": {
    path: "/tutor",
    ready: h1,
    seed: async (p) => {
      await p.evaluate(async () => {
        const db = await new Promise((ok) => {
          const r = indexedDB.open("linguanest");
          r.onsuccess = () => ok(r.result);
        });
        const tx = db.transaction("kv", "readwrite");
        const kv = tx.objectStore("kv");
        const prefs = await new Promise(
          (ok) => (kv.get("prefs").onsuccess = (e) => ok(e.target.result)),
        );
        kv.put({ ...prefs, saveConversations: false, level: "b1" }, "prefs");
        await new Promise((ok) => (tx.oncomplete = ok));
        db.close();
      });
    },
  },
  "Tutor-delete-dialog": {
    path: "/tutor?c=tutor_saved",
    ready: h1,
    seed: savedTutorChat,
    viewportOnly: true,
    act: async (p) => {
      await waitReply(p);
      await p.locator("main header button").click();
      await p.locator("dialog[open]").waitFor();
    },
  },
  "Tutor-prefill": {
    path: "/tutor?q=Explain%20the%20past%20simple",
    ready: h1,
  },
  "Tutor-autosend": {
    path: "/tutor?q=What%20is%20a%20noun%3F&send=1",
    ready: h1,
    api: { tutor: { sse: ["A **noun** is a word for a thing."] } },
    act: waitReply,
  },
  "Tutor-long-draft": {
    path: "/tutor",
    ready: h1,
    act: (p) => p.locator(composer).fill("long ".repeat(220)),
  },
});

Object.assign(pages, {
  "Tutor-save-data": {
    path: "/tutor",
    ready: h1,
    api: { tutor: { sse: ["Hello! ", "Nice to meet you."] } },
    act: async (p) => {
      await sendMessage(p, "Hi, I am Ana");
      await waitReply(p);
      await p.waitForURL(/c=tutor_/);
    },
    // Leaving the page logs the tutor session.
    after: async (p) => {
      await p.locator('a[href="/home"]').first().click();
      await p.waitForURL(/\/home$/);
    },
  },
  "Tutor-delete-data": {
    path: "/tutor?c=tutor_saved",
    ready: h1,
    seed: savedTutorChat,
    act: async (p) => {
      await waitReply(p);
      await p.locator("main header button").click();
      await p.locator("dialog[open] button.bg-danger").click();
      await p.waitForURL(/new=/);
    },
  },
});

const reportReply = {
  json: {
    successes: ["You greeted the waiter politely.", "You ordered clearly."],
    corrections: [
      {
        original: "I want a coffee",
        corrected: "Could I have a coffee, please?",
        explanation: "More polite.",
      },
    ],
    alternatives: [
      {
        original: "Give me the bill",
        natural: "Could we have the bill, please?",
      },
    ],
    vocabulary: [
      { word: "bill", meaning: "the paper that shows how much to pay" },
    ],
    nextSteps: ["Practise asking for the menu."],
  },
};
const startConversation = async (p) => {
  await p.locator("main button.w-full.h-12, main button.w-full").last().click();
  await p.locator("#conv-title").waitFor();
};
const converse = async (p) => {
  await startConversation(p);
  await sendMessage(p, "Hello, I would like a table for two.");
  await p.locator("main .prose-tutor").nth(1).waitFor();
};
const chip = (p, n) =>
  p.locator("main [role=group][aria-label=Help] button").nth(n).click();
Object.assign(pages, {
  "Conversation-setup": { path: "/conversation/ordering-food", ready: h1 },
  "Conversation-missing": {
    path: "/conversation/no-such-scenario",
    ready: (p) => p.locator("main .border-dashed").waitFor(),
  },
  "Conversation-start": {
    path: "/conversation/ordering-food",
    ready: h1,
    act: startConversation,
  },
  "Conversation-reply": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: {
      conversation: {
        sse: ["Of course! ", "Follow me, please. 💡 Tip: say *please*."],
      },
    },
    act: converse,
  },
  "Conversation-vocab": {
    path: "/conversation/ordering-food",
    ready: h1,
    act: async (p) => {
      await startConversation(p);
      await chip(p, 1);
    },
  },
  "Conversation-starters": {
    path: "/conversation/ordering-food",
    ready: h1,
    act: async (p) => {
      await startConversation(p);
      await chip(p, 2);
      await p.locator("main .rounded-3xl.bg-surface-2 button").first().click();
    },
  },
  "Conversation-suggest": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: {
      assist: {
        json: {
          suggestions: [
            "A table for two, please.",
            "Do you have a free table?",
          ],
        },
      },
    },
    act: async (p) => {
      await startConversation(p);
      await chip(p, 0);
      await p.locator("main .bg-indigo-soft button").first().waitFor();
    },
  },
  "Conversation-explain": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: {
      assist: {
        json: {
          text: "The waiter is asking how many people are with you.\nAnswer with a number.",
        },
      },
    },
    act: async (p) => {
      await startConversation(p);
      await chip(p, -1);
      await p.locator("main .bg-indigo-soft p").waitFor();
    },
  },
  "Conversation-report": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: { conversation: { sse: ["Of course!"] }, report: reportReply },
    act: async (p) => {
      await converse(p);
      await p.locator("main header button.h-9").last().click();
      await p.locator("main h1", { hasText: "Ordering" }).first().waitFor();
      await p.getByText("What went well").waitFor();
    },
  },
  "Conversation-report-invalid": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: {
      conversation: { sse: ["Of course!"] },
      report: { json: { successes: "x" } },
    },
    act: async (p) => {
      await converse(p);
      await p.locator("main header button.h-9").last().click();
      await p.locator("main [role=alert]").waitFor();
    },
  },
  "Conversation-unavailable": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: {
      status: { json: { enabled: false, configured: false, available: false } },
    },
    act: (p) => p.locator("main [role=status]").first().waitFor(),
  },
  "Conversation-save-data": {
    path: "/conversation/ordering-food",
    ready: h1,
    api: { conversation: { sse: ["Of course!"] }, report: reportReply },
    act: async (p) => {
      await converse(p);
      await p.locator("main header button.h-9").last().click();
      await p.getByText("What went well").waitFor();
    },
  },
});
for (const id of [
  "introduce-yourself",
  "new-friend",
  "ordering-food",
  "shopping-clothes",
  "groceries",
  "directions",
  "hotel",
  "train",
  "airport",
  "doctor",
  "phone-call",
  "job-interview",
  "colleague",
  "small-talk",
  "presentation",
  "discussion",
])
  pages["Scenario:" + id] = { path: "/conversation/" + id, ready: h1 };

const grammarIds = [
  "parts-of-speech",
  "nouns",
  "pronouns",
  "articles",
  "adjectives",
  "adverbs",
  "verbs",
  "verb-to-be",
  "auxiliary-verbs",
  "modal-verbs",
  "present-simple",
  "present-continuous",
  "past-tenses",
  "future",
  "continuous-tenses",
  "perfect-tenses",
  "conditionals",
  "passive-voice",
  "reported-speech",
  "relative-clauses",
  "prepositions",
  "conjunctions",
  "questions",
  "sentence-structure",
  "punctuation",
  "common-mistakes",
];
for (const id of grammarIds)
  pages["Grammar:" + id] = { path: "/grammar/" + id, ready: h1 };
