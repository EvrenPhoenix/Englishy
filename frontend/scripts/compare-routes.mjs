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
};
