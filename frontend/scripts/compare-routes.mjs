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
