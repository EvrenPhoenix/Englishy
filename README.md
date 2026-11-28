# Englishy

**Live site:** https://englishy.assistant-service.workers.dev (Cloudflare Worker `englishy`)

Englishy is an English-learning web app for absolute beginners through A1. It offers structured lessons, grammar, vocabulary review, speaking and listening exercises, writing feedback, conversation practice and an NVIDIA-powered AI tutor. Learners can use the core lessons as guests and keep their progress in their browser.

## Project layout

- `frontend/` is the editable React, Vite and Tailwind CSS source for the browser app. `npm run build` there outputs `frontend/dist`, including a generated `sw.js` and `theme-init.js`.
  - `frontend/sw-template.js` is the service worker source. `frontend/vite.config.ts` fills in its cache version and precache list and writes the result to `dist/sw.js`.
  - `frontend/public/` (icons, the social preview image `og/og-image.png`, web app manifest, offline page, `robots.txt`, `sitemap.xml`) is copied into the build unchanged.
  - `frontend/scripts/` holds the course-content check (`check:data`), the backup merge tests (`test:merge`), the saved-profile check (`check:profile`) and the parity tools, all described below. `frontend/scripts/check-worker.mjs` checks a running `npx wrangler dev`: deep links, static files and headers, the API, and offline use through the service worker.
- `worker/` contains the recovered Cloudflare Worker API, NVIDIA client, usage safeguards and tutor prompts.
- `shared/` contains the brand, constants, scenarios and validation schemas used by both the Worker and the frontend.
- `deploy/embedded-worker.ts` is the Worker entry point. It passes `/api/*` requests to `worker/index.ts`. It also serves the embedded browser files with their content types and caching headers, and uses the app shell for routes such as `/learn`.
- `scripts/build-embedded.mjs` packages `frontend/dist` into the ignored `dist/embedded/assets.js` module. `npm run build` at the root builds the frontend and then runs this script, and Wrangler runs `npm run build` for development and deployment.
- `frontend-compiled/` is the compiled release recovered from the live site before the rebuild. It is no longer deployed. It is kept as the reference for parity checks and course-content checks: `FRONTEND_DIR=frontend-compiled node scripts/build-embedded.mjs` embeds it instead. The `archive/original-release` branch keeps the repository as it was before the rebuild.

Inside `frontend/src`: `pages/` holds one file (or folder, for larger pages) per route, `components/ui/` the shared buttons, fields, notices, dialogs and badges, `components/` the app shell, chat, exercise and speech components, `lib/` storage, AI, speech and progress logic, `data/` the course content, and `i18n/` the translations.

## Local development

Use Node.js 22.22 or newer (`.nvmrc` pins 22) and npm from the repository root.

```sh
npm install          # also installs frontend/ dependencies
npx wrangler dev     # builds the frontend and serves the Worker
```

Open the localhost URL printed by Wrangler. To enable the AI features locally, copy `.dev.vars.example` to `.dev.vars` and replace the placeholder with your NVIDIA API key. Keep `.dev.vars` out of Git.

For frontend work with hot reload, run `npm run dev` in `frontend/` alongside `npx wrangler dev`; Vite proxies `/api` to the Worker on port 8787.

## Verification and deployment

```sh
npm run typecheck
npm --prefix frontend run typecheck
npm --prefix frontend run check:data      # lesson, grammar, vocabulary and locale content vs the recovered release
npm --prefix frontend run test:merge      # backup merge unit tests
npx wrangler deploy --dry-run
```

GitHub Actions runs these checks (and the dry run) on every pull request and push to `main` (`.github/workflows/ci.yml`). The dry run bundles the Worker and frontend locally. For an authorised Cloudflare release, sign in to the account that owns the `englishy` Worker, configure the NVIDIA key as a Worker secret, and run `npm run deploy`. To set or rotate the secret, use `npx wrangler secret put NVIDIA_API_KEY` and enter the value interactively. That command can create and deploy a new Worker version, so run it only when a production change is intended.

### Parity checks against the recovered release

`frontend/scripts/` compares the rebuilt app with `frontend-compiled/` in Chromium. Serve the reference with the Worker on port 8787 (`FRONTEND_DIR=frontend-compiled`) and the rebuild with `npx vite preview --port 4173` in `frontend/`, then run these commands from `frontend/` (or call them as `frontend/scripts/...` from the repository root):

```sh
node scripts/compare-pages.mjs <page>[,<page>...]   # screenshots, text, titles, API calls, console errors
node scripts/check-flow-data.mjs <page>[,...]       # stored IndexedDB and localStorage after a flow
node scripts/check-settings-data.mjs                # backup restore, replace, clear and preferences
```

Pages and flows are defined in `frontend/scripts/compare-routes.mjs`. Every capture seeds the same saved learner, freezes time, disables animation and answers `/api/*` from fixtures, so no live AI is called. Set `CHROME_PATH` if Playwright's bundled browser is not installed.

`npm --prefix frontend run check:profile` (`frontend/scripts/check-saved-profile.mjs`) opens five pages with the same saved learner on `REFERENCE_URL` and on `FRONTEND_URL` (default `http://127.0.0.1:4173`), and checks that both show the same states and keep the saved data. `REFERENCE_URL` defaults to the live site, which now serves the rebuild, so set it to `http://127.0.0.1:8787` to compare with the recovered release. This script reads `CHROMIUM_PATH` instead of `CHROME_PATH`.

## Rebuild notes

The original frontend source was lost; the app was rebuilt from the compiled release and verified screen by screen (desktop and mobile, light and dark, and Arabic right-to-left) and by comparing stored learner data. Existing learners keep their progress: the IndexedDB database (`linguanest` v2), its stores, the `ln-` localStorage keys, the backup format and the service worker cache prefix are unchanged. Zod is pinned to the recovered version, 4.6.7.

## Fixes vs original app

The rebuilt frontend matches the compiled release except for these intentional fixes. Each one lands in its own commit after a faithful rebuild of the page.

| Area | Original behaviour | Rebuilt behaviour | Test |
| --- | --- | --- | --- |
| Settings → **Add to my progress (safe)** | When a backup lesson had a higher best score, its latest attempt score and date replaced a newer attempt already on the device. A newly completed backup row with a lower best score could also lower the stored best. | Keeps the higher best score, the larger attempt count and the earlier start date, and takes the latest attempt's score and date together from whichever record was updated more recently. Storage format is unchanged. | `frontend: npm run test:merge`, `frontend/scripts/check-settings-data.mjs --expect-merge-fix` |

## Licence

The code written for Englishy is under the MIT licence (see `LICENSE`). Third-party parts, such as the Lexend font (`frontend/src/styles/fonts/OFL.txt`) and the npm packages bundled into the Worker, keep their own licences; they are listed in `THIRD_PARTY_NOTICES.md`.
