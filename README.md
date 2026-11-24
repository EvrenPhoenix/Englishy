# Englishy

Englishy is an English-learning web app for absolute beginners through A1. It offers structured lessons, grammar, vocabulary review, speaking and listening exercises, writing feedback, conversation practice and an NVIDIA-powered AI tutor. Learners can use the core lessons as guests and keep their progress in their browser.

## Project layout

- `worker/` contains the recovered Cloudflare Worker API, NVIDIA client, usage safeguards and tutor prompts.
- `shared/` contains the recovered brand, constants, scenarios and validation schemas.
- `deploy/embedded-worker.ts` is the Worker entry point. It passes `/api/*` requests to `worker/index.ts`. It also serves the embedded browser files with their content types and caching headers, and uses the app shell for routes such as `/learn`.
- `frontend-compiled/` contains the compiled browser files recovered from the live release. It includes the lesson-resume, listening-score and mobile dashboard changes in release 3. Unchanged assets are shared between the original and versioned URLs to support existing sessions.
- `scripts/build-embedded.mjs` regenerates the ignored `dist/embedded/assets.js` module from the compiled frontend. Wrangler runs this automatically for development and deployment. The script packages the existing browser files. It does not compile React source.

## Local development

Use Node.js 24 and npm from the repository root.

```sh
npm install
npx wrangler dev
```

Open the localhost URL printed by Wrangler. To enable the AI features locally, copy `.dev.vars.example` to `.dev.vars` and replace the placeholder with your NVIDIA API key. Keep `.dev.vars` out of Git.

## Verification and deployment

```sh
npm run typecheck
npx wrangler deploy --dry-run
```

The dry run bundles the Worker and frontend locally. For an authorised Cloudflare release, sign in to the account that owns the `englishy` Worker, configure the NVIDIA key as a Worker secret, and run `npm run deploy`. To set or rotate the secret, use `npx wrangler secret put NVIDIA_API_KEY` and enter the value interactively. That command can create and deploy a new Worker version, so run it only when a production change is intended.

## Known limitation

The original frontend source was lost. `frontend-compiled/` is the compiled build recovered from the live site. The editable React, Vite and Tailwind source will be rebuilt later. The Worker source was recovered from its source map, and Zod is pinned to the recovered version, 4.6.7.

## Fixes vs original app

The rebuilt frontend matches the compiled release except for these intentional fixes. Each one lands in its own commit after a faithful rebuild of the page.

| Area | Original behaviour | Rebuilt behaviour | Test |
| --- | --- | --- | --- |
| Settings → **Add to my progress (safe)** | When a backup lesson had a higher best score, its latest attempt score and date replaced a newer attempt already on the device. A newly completed backup row with a lower best score could also lower the stored best. | Keeps the higher best score, the larger attempt count and the earlier start date, and takes the latest attempt's score and date together from whichever record was updated more recently. Storage format is unchanged. | `frontend: npm run test:merge`, `scripts/check-settings-data.mjs --expect-merge-fix` |
