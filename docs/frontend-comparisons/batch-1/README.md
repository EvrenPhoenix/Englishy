# Englishy frontend comparisons · Batch 1

Each link opens a lossless full-page image with the live site on the left and the local production build on the right. Playwright used Chromium at device scale factor 1, with 1280 × 900 and 390 × 844 viewports. The Arabic run used the app’s Arabic interface and RTL layout. Text, links, document metadata and API requests were also checked. The final pairs have identical dimensions and zero differing RGB pixels.

| Page | Desktop light | Desktop dark | Mobile light | Mobile dark | Mobile Arabic, light |
| --- | --- | --- | --- | --- | --- |
| NotFound | [Compare](NotFound-1280-light-en.webp) | [Compare](NotFound-1280-dark-en.webp) | [Compare](NotFound-390-light-en.webp) | [Compare](NotFound-390-dark-en.webp) | [Compare](NotFound-390-light-ar.webp) |
| Help | [Compare](Help-1280-light-en.webp) | [Compare](Help-1280-dark-en.webp) | [Compare](Help-390-light-en.webp) | [Compare](Help-390-dark-en.webp) | [Compare](Help-390-light-ar.webp) |
| Guide | [Compare](Guide-1280-light-en.webp) | [Compare](Guide-1280-dark-en.webp) | [Compare](Guide-390-light-en.webp) | [Compare](Guide-390-dark-en.webp) | [Compare](Guide-390-light-ar.webp) |

NotFound was captured at `/missing-page`, Help at `/help`, and Guide at `/guides/learn-english-for-beginners`. All six published guide slugs, the missing-guide fallback, and the NotFound home link were exercised separately. Both versions produced the same guide text, links, and metadata. The captures recorded zero browser console errors and zero uncaught page errors.

Help sent one `GET /api/ai/status` with `Accept: application/json` and an empty request body. The screenshot comparison replayed the live status response in the local browser so both showed “available”. A separate browser run called the local Worker directly through the frontend proxy and confirmed the “not available right now” state. On a browser reconnect, each build made one further identical GET. NotFound and Guide made zero API requests.

## IndexedDB compatibility

The compiled release already opens `linguanest` at version 2. Both fresh databases and upgrades from the same version-1 fixture were compared in isolated Chromium profiles. Store and index metadata matched, including key paths, auto-increment, uniqueness and multi-entry settings. The version-1 fixture kept its completed lesson and an unrelated preference field through the original daily-goal migration.

| Store | Primary key in both builds | Index names and key paths in both builds |
| --- | --- | --- |
| `kv` | Out-of-line key, including `prefs` | None |
| `lessons` | `lessonId` | None |
| `activities` | `id` | `by-day` → `day`, `by-type` → `type` |
| `vocab` | `id` | `by-due` → `srs.due` |
| `conversations` | `id` | None |
| `results` | `id` | `by-lesson` → `lessonId`, `by-at` → `at` |

Version 1 created the first five stores. Version 2 added the results store with both indexes and the activity type index. It also moved `prefs.dailyGoal` to `dailyGoalMinutes` when the old field existed and the new field was absent. The rebuild uses the same two steps. The identifiers are centralized in [storage-keys.ts](../../../frontend/src/lib/storage-keys.ts).
