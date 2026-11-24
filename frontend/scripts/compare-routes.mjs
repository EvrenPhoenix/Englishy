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
