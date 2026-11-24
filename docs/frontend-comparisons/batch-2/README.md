# Englishy frontend comparisons · Batch 2

Each image shows the live site on the left and the local production build on the right. Playwright used Chromium at device scale factor 1 with 1280 × 900 and 390 × 844 viewports. All 25 final pairs had the same dimensions and zero differing RGB pixels. Both pages used the same synthetic learner, locale and theme. On Landing, both captures paused the animated gradient at the same frame. One repeat of desktop light Landing differed at 59 pixels by at most two RGB channel levels. An immediate fresh capture of the same build matched exactly.

| Page | Desktop light | Desktop dark | Mobile light | Mobile dark | Mobile Arabic RTL, light |
| --- | --- | --- | --- | --- | --- |
| Landing | [Compare](Landing-1280-light-en.webp) | [Compare](Landing-1280-dark-en.webp) | [Compare](Landing-390-light-en.webp) | [Compare](Landing-390-dark-en.webp) | [Compare](Landing-390-light-ar.webp) |
| Grammar library | [Compare](GrammarPage-1280-light-en.webp) | [Compare](GrammarPage-1280-dark-en.webp) | [Compare](GrammarPage-390-light-en.webp) | [Compare](GrammarPage-390-dark-en.webp) | [Compare](GrammarPage-390-light-ar.webp) |
| Learn | [Compare](LearnPage-1280-light-en.webp) | [Compare](LearnPage-1280-dark-en.webp) | [Compare](LearnPage-390-light-en.webp) | [Compare](LearnPage-390-dark-en.webp) | [Compare](LearnPage-390-light-ar.webp) |
| Conversation list | [Compare](ConversationList-1280-light-en.webp) | [Compare](ConversationList-1280-dark-en.webp) | [Compare](ConversationList-390-light-en.webp) | [Compare](ConversationList-390-dark-en.webp) | [Compare](ConversationList-390-light-ar.webp) |
| Progress | [Compare](ProgressPage-1280-light-en.webp) | [Compare](ProgressPage-1280-dark-en.webp) | [Compare](ProgressPage-390-light-en.webp) | [Compare](ProgressPage-390-dark-en.webp) | [Compare](ProgressPage-390-light-ar.webp) |

## Saved learner checks

The fixture starts with a completed alphabet lesson scored at 87.5%, a started sounds lesson, three activities, three exercise results, two saved words, a tutor chat, a completed scenario, and writing and lesson drafts. It uses a fixed browser date so that activity and streak comparisons are repeatable.

| Page | Verified against the live release |
| --- | --- |
| Landing | The shared theme control toggles light and dark. The chosen theme survives reload. Switching it back restores the full original storage snapshot. |
| Grammar library | Category filtering, search within a category, empty results, clearing search and resetting the category. |
| Learn | The completed lesson displays 88%. The started lesson shows both “In progress” and “Up next.” The A1 level, planned B1 level and a direct link to unit 5 match. |
| Conversation list | The completed scenario displays “Practised.” Travel, Social and All filters show the same scenario cards and badges. |
| Progress | Both builds report 1 of 43 lessons completed, 13 minutes, 42 XP, a two-day streak and two saved words including one mastered. Both show the same earned achievements, recent accomplishment and 33% revision topic. Keyboard focus on a chart bar and the 14-row table match. |

The checks compared rendered text, links, page metadata, text direction, console errors, uncaught page errors and frontend API requests. Both builds made zero API requests in the tested views and interactions. Each page preserved every IndexedDB key, value and localStorage entry after testing. The database version, stores, key paths and indexes matched between builds. A separate run compared Learn, Conversation List and Progress with an empty learner profile.

The interaction check also disconnects each already-loaded page. Grammar filtering and switching Progress to its table view work offline. Offline cold starts and service worker integration belong to the switch-over phase.

## Repeating the interaction checks

From `frontend/`, run `npm ci`, `npm run build` and `npx vite preview --port 4173`. With the preview running, use a second terminal in the same directory.

```sh
npx playwright-core install chromium
npm run check:profile
```

The runner uses a fresh browser context for each origin and page. To check a single page, run `npm run check:profile -- ProgressPage`. Set `FRONTEND_URL` or `REFERENCE_URL` to change the origins. Set `CHROMIUM_PATH` to use an installed Chromium executable.
