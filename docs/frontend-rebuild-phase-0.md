# Englishy frontend rebuild · Phase 0

The reference is the compiled release served by `frontend-compiled/index.html`. Its entry is under `assets/englishy-eb9f4dbb9de9/`. The Worker serves the six overridden modules from that directory and aliases unchanged modules to their base copies. Use this release for parity, including the next-lesson placement, saved lesson attempts and unscored listening fallback. React and React DOM identify themselves as 19.3.1. The CSS banner identifies Tailwind CSS 4.3.5. The entry includes Vite's dynamic preloading and the React Router runtime. Their exact package versions are unverified.

## Asset inventory

There are 83 files in `frontend-compiled/assets/` including the six release overrides. Paths below are relative to that directory.

| File | Role |
| --- | --- |
| `Landing-BItdrU_K.js` | Public landing page |
| `Onboarding-B8GsvFe2.js` | Onboarding flow |
| `PlacementPage-CtwonDDd.js` | Placement check and optional writing evaluation |
| `Dashboard-CCpx_uau.js` | Home dashboard |
| `LearnPage-DzQmL-pN.js` | Curriculum browser |
| `LessonPage-DK3NT-kU.js` | Lesson instruction, practice and summary |
| `ExerciseView-BMlkCdrs.js` | Shared exercise renderer, answers, hints and feedback |
| `PractisePage-yQuCjgUJ.js` | Practice catalogue, review and AI exercise generation |
| `PracticeSession-CEKS-r7_.js` | Shared practice session, scoring and recording |
| `SpeakingPage-DdXS3g7D.js` | Speaking and listening activities |
| `WritingPage-BYUUGQRC.js` | Writing editor and correction review |
| `VocabularyPage-D9WZh8pR.js` | Vocabulary topics, notebook and review |
| `GrammarPage-BwoVeEST.js` | Grammar catalogue |
| `GrammarTopicPage-ClTbTKDv.js` | Grammar topic and practice |
| `ConversationList-BKBigtTZ.js` | Role-play scenario catalogue |
| `ConversationPage-Bl06a9z3.js` | Scenario setup, role-play and report |
| `Chat-DbAWiccV.js` | Shared chat UI and suggestion controls |
| `Composer-D_Po5jtE.js` | Shared message input, submit and stop controls |
| `TutorPage-NIENWIWu.js` | Tutor chat and history |
| `ProgressPage-DYdyRaYD.js` | Progress and achievements UI |
| `Settings-Bq2QZJXQ.js` | Preferences, portable profile backup and data controls |
| `Help-cVwVNBeO.js` | Help, privacy and accessibility information |
| `Guide-g0pn2qGm.js` | Public guide template |
| `NotFound-Blij-6Ms.js` | Missing route or resource UI |
| `RichText-BqTYqkrh.js` | Shared rich-text rendering |
| `SpeechControls-_rI90RG2.js` | Playback, speed, microphone consent and transcription controls |
| `brand-29nU70PD.js` | Brand/configuration, reusable UI and React/JSX runtime |
| `index-CJhEbyla.js` | Entry, router, app shells, persistence, scheduling, curriculum, service-worker registration and bundled runtimes |
| `ai-BFDFHR9h.js` | AI availability, JSON and SSE transport, timeouts and errors |
| `speech-Bj06CoGr.js` | Browser synthesis and recognition adapters, microphone preference |
| `useActiveTime-8b0uDf1A.js` | Activity timing hook |
| `useChat-DN72XxNj.js` | Chat state and streamed reply handling |
| `useMeta-DyXxfmjF.js` | Page title and metadata hook |
| `validate-DkSKaKxp.js` | Answer normalisation and validation |
| `types-XKRjlI-1.js` | Exercise constructors and stable exercise IDs |
| `schemas-BVJ99nmm.js` | Shared API schemas and frontend response validators |
| `schemas-gaqX7Gro.js` | Bundled Zod implementation |
| `data-B9LX0-kj.js` | Grammar topics and practice, with generated `g-<topic-id>:<n>` exercise IDs |
| `data-Dz1-iQqH.js` | Vocabulary topics, bank entries, translations and lookup |
| `vocab-BnTsZ2yD.js` | Vocabulary bank-to-notebook adaptation and bookmark icons |
| `achievements-DIIZM8R4.js` | Achievement metadata and progress rules |
| `guides-Ju1Gv_OJ.js` | Six public guide articles and links |
| `scenarios-CSJufgkR.js` | Conversation scenarios and lookup |
| `languages-BOjtRfCB.js` | Language selection metadata |
| `i18n-DBb69MOl.js` | English baseline messages, locale registry, lazy loading, interpolation and direction |
| `ar-C8ALe_A1.js`, `bn-C-7CTN7Z.js` | Arabic and Bengali locale dictionaries |
| `es-CW2gzTXB.js`, `fr-DwWU3EqE.js` | Spanish and French locale dictionaries |
| `hi-D1LL7rVk.js`, `pt-xqz-W8E2.js`, `zh-DeBN_Y9K.js` | Hindi, Portuguese and Simplified Chinese locale dictionaries |
| `icons-CclmMh9Y.js` | Shared icon registry |
| `arrow-left-CkupHnBg.js`, `arrow-right-CCU5CBRn.js`, `book-open-DHMguvI1.js`, `check-CbqMqHGm.js`, `chevron-down-DutCit6t.js`, `chevron-right-CfUSvtRA.js` | Individual SVG icon chunks |
| `compass-DomQ_9Db.js`, `copy-CyWsEqAC.js`, `headphones-BwEV9rwS.js`, `keyboard-Cde3fuIM.js`, `lightbulb-CFQn7oSA.js`, `lock-BSJRCGTV.js` | Individual SVG icon chunks |
| `repeat-afnhU20i.js`, `rotate-ccw-Bh2IGEpt.js`, `search-B3TKAcgF.js`, `square-CMKK9BV1.js`, `target-C-d3I1Au.js`, `trash-BeIq4WS6.js`, `trophy-Blvk5a-i.js`, `users-BYHRzO2M.js` | Individual SVG icon chunks |
| `index-C9Y4pg0R.css` | Tailwind utility output, global rules and theme tokens |
| `lexend-latin-ext-wght-normal-B6JQhE1e.woff2`, `lexend-latin-wght-normal-ci0D1wrL.woff2`, `lexend-vietnamese-wght-normal-RvljkFvg.woff2` | Lexend Variable font subsets |
| `englishy-eb9f4dbb9de9/Dashboard-CCpx_uau.js` | Current dashboard with the lesson above the AI composer |
| `englishy-eb9f4dbb9de9/ExerciseView-BMlkCdrs.js` | Current exercise renderer with saved answers and practice-only feedback |
| `englishy-eb9f4dbb9de9/LessonPage-DK3NT-kU.js` | Current lesson page with draft persistence and updated summary |
| `englishy-eb9f4dbb9de9/PracticeSession-CEKS-r7_.js` | Current practice session with device-skip scoring |
| `englishy-eb9f4dbb9de9/SpeechControls-_rI90RG2.js` | Current speech controls with unavailable-audio feedback |
| `englishy-eb9f4dbb9de9/index-CJhEbyla.js` | Current entry with release-scoped preload URLs |

The lesson and unit arrays are embedded in the entry module, separately from the grammar and vocabulary banks. Extract the 43 lessons and seven units from there, preserving lesson order, exercise IDs, exact text, translations, punctuation, answer alternatives and scoring metadata. Keep the fixed scenario opening lines, guide text and locale fallback strings verbatim. Compare the shared scenario source with the compiled records before reusing it.

## Routes

| Path | Page or action | Layout |
| --- | --- | --- |
| `/` | Landing | Public wrapper |
| `/guides/:slug` | Guide | Public wrapper |
| `/start` | Onboarding | Public wrapper |
| `/placement` | PlacementPage | Public wrapper |
| `/home` | Dashboard | App shell |
| `/learn` | LearnPage | App shell |
| `/learn/:lessonId` | LessonPage | App shell |
| `/practise` | PractisePage | App shell |
| `/practice` | Replace redirect to `/practise` | App shell |
| `/tutor` | TutorPage | App shell |
| `/conversation` | ConversationList | App shell |
| `/conversation/:scenarioId` | ConversationPage | App shell |
| `/speaking` | SpeakingPage | App shell |
| `/vocabulary` | VocabularyPage | App shell |
| `/grammar` | GrammarPage | App shell |
| `/grammar/:topicId` | GrammarTopicPage | App shell |
| `/writing` | WritingPage | App shell |
| `/progress` | ProgressPage | App shell |
| `/settings` | Settings | App shell |
| `/help` | Help | App shell |
| `/privacy` | Replace redirect to `/help#privacy` | App shell |
| `*` | NotFound | App shell |

Preserve tutor query parameters `c`, `new`, `q` and `send`, vocabulary `review` and `tab`, speaking `tab`, and in-page hashes on guide, learn and help links. The Worker serves the app shell for deep links. `/offline` can resolve to the standalone offline page.

## API calls

All eight frontend endpoint paths have Worker handlers. The POST routes dispatch through `worker/index.ts` to the listed handlers in `worker/routes/ai.ts`. Request and response schemas are in `shared/schemas.ts`. The rebuilt client should retain same-origin URLs, abort handling, error envelopes and JSON versus streaming semantics. Streams carry named `delta`, `done` and `error` events.

| Method and path | Caller | Server handler and response |
| --- | --- | --- |
| GET `/api/ai/status` | Shared AI availability hook | `worker/index.ts`, JSON |
| POST `/api/ai/tutor` | TutorPage, including dashboard prompt handoff | `tutor`, SSE |
| POST `/api/ai/conversation` | ConversationPage | `conversation`, SSE |
| POST `/api/ai/assist` | ConversationPage | `assist`, JSON suggestions or text |
| POST `/api/ai/report` | ConversationPage | `report`, JSON |
| POST `/api/ai/writing` | WritingPage, PlacementPage and ExerciseView | `writing`, JSON |
| POST `/api/ai/explain` | LessonPage and ExerciseView | `explain`, SSE |
| POST `/api/ai/exercises` | PractisePage | `exercises`, JSON |

`GET /api/health` exists in the Worker for health checks. The browser bundle has no call to it.

## Browser state and compatibility

Keep the origin, IndexedDB name `linguanest` and schema version 2. Keep store names, record shapes and key paths so existing data reads in place.

| IndexedDB store | Key and indexes |
| --- | --- |
| `kv` | Explicit keys including `prefs` |
| `lessons` | `lessonId` |
| `activities` | `id`, indexes `by-day` on `day` and `by-type` on `type` |
| `vocab` | `id`, index `by-due` on `srs.due` |
| `conversations` | `id` |
| `results` | `id`, indexes `by-lesson` on `lessonId` and `by-at` on `at` |

Retain the version-1 upgrade that renames `prefs.dailyGoal` to `dailyGoalMinutes` when needed. Maintain default preference merging, in-memory fallback when IndexedDB is unavailable, and change notifications through the `linguanest-store` BroadcastChannel. Keep the `linguanest-progress` backup format and its import validation. Preserve identities such as `bank:<id>` for saved bank words so existing notebook entries match the extracted data.

| Storage | Key | Purpose |
| --- | --- | --- |
| localStorage | `ln-theme` | Selected theme, separately readable before app startup |
| localStorage | `ln-sidebar` | Sidebar state, `open` or `collapsed` |
| localStorage | `ln-writing-draft` | Writing editor draft |
| localStorage | `ln-mic-consent` | Microphone consent marker, `yes` |
| localStorage | `ln-lesson-draft:<lessonId>` | Object with `version: 1`, `index`, ordered `exerciseIds` joined by `|`, and `outcomes` keyed by exercise ID |
| sessionStorage | `remix-router-transitions` | React Router view-transition bookkeeping |

Data clearing removes the IndexedDB records and localStorage keys prefixed `ln-`. Prior to switching builds, use a browser fixture populated by the current release to verify the rebuilt release can read lesson progress, drafts, vocabulary, preferences and chat history.

## Theme, language and offline

- The synchronous `theme-init.js` script reads `ln-theme` before first paint and resolves Light, Dark or System via `prefers-color-scheme`. The preferences provider applies `data-theme`, `data-text-size` and `data-motion`, responds to system changes, and updates the theme-color meta tag. Theme colours are light `#ffffff` and dark `#131314`.
- The i18n provider lazy-loads the seven non-English dictionaries. It falls back to English per key, applies interpolation, and sets document language and direction. Arabic sets `dir="rtl"`. Retain logical spacing, direction-sensitive icons and the separate native/explanation language choices.
- The browser registers `/sw.js` with scope `/`. The service worker precaches the app shell and offline curriculum files in `linguanest-englishy-eb9f4dbb9de9`. Navigation is network-first with cached shell or offline-page fallback. Hashed assets are cache-first, other static files are stale-while-revalidate, and API requests bypass caching. Updates wait for user acceptance before `SKIP_WAITING`, activation clears older `linguanest-` caches, and the app reloads on the accepted controller change.
- The manifest identifies the app as `/`, starts it at `/home`, and uses standalone display with scope `/`. Keep standard and maskable icons, the shortcuts for learning, vocabulary review and tutor, plus `offline.html`, `robots.txt`, `sitemap.xml` and the social image.

## Design tokens

These values are from the compiled CSS. The primary typeface is Lexend Variable, followed by system UI, Segoe UI, Noto Sans, Noto Sans Devanagari, Noto Sans Bengali, Noto Sans Arabic, PingFang SC and Microsoft YaHei. Monospace starts with ui-monospace and SFMono-Regular. Keep the original font files and fallback order.

| CSS variable | Light | Dark |
| --- | --- | --- |
| `--bg` | `#fff` | `#131314` |
| `--sidebar` | `#f6f7f7` | `#1b1c1e` |
| `--surface` | `#fff` | `#1c1d1f` |
| `--surface-2` | `#f3f4f4` | `#27282b` |
| `--surface-3` | `#e7e9e9` | `#323337` |
| `--raised` | `#fff` | `#2a2b2f` |
| `--border` | `#e5e7e7` | `#2d2e32` |
| `--border-strong` | `#cbd0d0` | `#45474c` |
| `--text` | `#111414` | `#e8eaed` |
| `--muted` | `#5d6464` | `#a1a6ac` |
| `--primary` | `#0f766e` | `#2dd4bf` |
| `--primary-hover` | `#0b5f59` | `#5eead4` |
| `--primary-soft` | `#e2f3f0` | `#11302c` |
| `--primary-text` | `#0b5c56` | `#5eead4` |
| `--on-primary` | `#fff` | `#04201c` |
| `--accent` and soft | `#95400a` / `#fcefdf` | `#f5b25a` / `#382914` |
| `--indigo` and soft | `#4338ca` / `#ebeafd` | `#a5b4fc` / `#23254a` |
| `--success` and soft | `#116232` / `#e2f4e8` | `#4ade80` / `#11301f` |
| `--danger` and soft | `#b42318` / `#fdebe8` | `#fb8a7e` / `#3a1b18` |
| `--warning` and soft | `#855700` / `#fcf2d8` | `#f5c451` / `#352a10` |
| `--ring` | `#0f766e` | `#5eead4` |
| `--chart-1` | `#0d9488` | `#18a999` |
| `--grad-1`, `--grad-2`, `--grad-3` | `#0f766e`, `#4f46e5`, `#a21caf` | `#5eead4`, `#a5b4fc`, `#f0abfc` |
| `--shadow` | `0 1px 2px #1114140a, 0 2px 8px #1114140a` | `0 1px 2px #0000004d` |
| `--shadow-lg` | `0 4px 12px #1114140f, 0 18px 44px #1114141f` | `0 10px 30px #00000073, 0 2px 6px #0000004d` |

- Spacing unit `.25rem`. Responsive breakpoints `40 / 48 / 64 / 80 / 96rem`. Container widths `24 / 28 / 32 / 36 / 42 / 48 / 56 / 64 / 72rem`.
- Font sizes `.75 / .875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.25 / 3 / 3.75rem`. Weights `400 / 500 / 600`. Tight letter spacing `-.025em`. Large and extra-large text settings scale the root to `112.5%` and `125%`. Hindi, Bengali and Arabic use body line-height `1.75`.
- Corners `.375 / .5 / .75 / 1 / 1.5rem` plus fully rounded pills. Backdrop blur `12px`. Default utility transition `.15s` with `cubic-bezier(.4, 0, .2, 1)`. Preserve reduced-motion and forced-colour rules.

## Rebuild plan

```text
frontend/
├── public/             Existing static PWA, icon and metadata assets
├── src/
│   ├── pages/          Route-level React components
│   ├── components/     Public and app shells, UI, exercises, chat and speech
│   ├── data/           Typed lessons, units, grammar, vocabulary, scenarios, guides and achievements
│   ├── i18n/           Locale files, provider and direction
│   ├── lib/            Storage, progress, speech, AI transport and service worker integration
│   ├── styles/         Tailwind entry, tokens and global styles
│   ├── main.tsx
│   └── router.tsx
└── scripts/            Extraction and data-parity checks
```

Phase 1 should compare the typed records against the compiled runtime values with a recursive equality check. Cover ordering, exact Unicode text, optional fields, IDs, exercise answers and locale keys. Capture parity fixtures from the authoritative versioned release where behaviour changed. Keep the current Worker build active.

Suggested Phase 2 batches, from simpler pages to interaction-heavy flows:

1. NotFound, Help, Guide and Landing.
2. GrammarPage, LearnPage, ConversationList and ProgressPage.
3. Dashboard, Onboarding, Settings and PlacementPage.
4. GrammarTopicPage, VocabularyPage, WritingPage and SpeakingPage.
5. TutorPage, ConversationPage, PractisePage and LessonPage. Complete their shared Chat, Composer, ExerciseView and PracticeSession components alongside the first dependent route.

For each page, compare live and local browser screenshots at 1280px and 390px in light and dark mode. Use the same viewport, route parameters and learner state. For AI pages, replay the same captured JSON or SSE response for screenshots, and separately compare request paths, methods and payloads. Check console errors, keyboard behaviour, persisted data and offline behaviour before counting a page as matched.

Phase 3 switches the asset input only after route parity passes. Preserve the static assets and keep the compiled reference in the repository. Finish with local Worker route tests and a deployment dry run, then open the pull request for review.
