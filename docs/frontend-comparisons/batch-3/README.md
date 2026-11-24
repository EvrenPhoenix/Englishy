# Phase 2 · Dashboard, Onboarding and Settings checkpoint

Dashboard and Onboarding matched the live release in all ten full-page Chromium comparisons. Each image shows the live page on the left and the editable build on the right. The captures used the same saved profile, disabled CSS animations and transitions, and waited for fonts. The Dashboard composer was filled and cleared before capture so both textareas measured the loaded font.

| Page | Desktop light | Desktop dark | Mobile light | Mobile dark | Mobile Arabic RTL |
| --- | --- | --- | --- | --- | --- |
| Dashboard | [Compare](Dashboard-1280-light-en.webp) | [Compare](Dashboard-1280-dark-en.webp) | [Compare](Dashboard-390-light-en.webp) | [Compare](Dashboard-390-dark-en.webp) | [Compare](Dashboard-390-light-ar.webp) |
| Onboarding | [Compare](Onboarding-1280-light-en.webp) | [Compare](Onboarding-1280-dark-en.webp) | [Compare](Onboarding-390-light-en.webp) | [Compare](Onboarding-390-dark-en.webp) | [Compare](Onboarding-390-light-ar.webp) |

Desktop used 1280 × 900 and mobile used 390 × 844. All ten final pairs had identical dimensions and zero differing RGB pixels. Accessible page text, link destinations, document titles and direction matched. Both pages passed the frontend build and typecheck. The tests blocked service workers and intercepted API traffic before the first navigation. The tested flows recorded zero API requests and zero console or page errors.

On Dashboard, the saved profile showed the next lesson, 1 of 43 lessons completed, 8 of 15 daily minutes, a two-day streak and two words due. The sentence chip populated and focused the composer, overlong text disabled Send, and Shift+Enter added a newline. Onboarding matched through all seven steps, including the optional placement choice, a custom daily goal, and saving the selected preferences. Both builds preserved every saved lesson, activity, exercise result, word, conversation and local draft in these checks.

## Settings backup merge

The live release reproduced a regression before the Settings rebuild began. The test used two isolated browser contexts and synthetic progress for the same alphabet lesson. The first context downloaded a backup through Settings. The second already held a newer attempt. In that second context the test selected the downloaded file and clicked **Add to my progress (safe)**.

| Lesson field | On device before merge | Incoming backup | Observed after merge |
| --- | --- | --- | --- |
| Best score | 87.5% | 100% | 100% |
| Latest attempt score | 75% | 100% | 100% |
| Latest update | November 24, 2026 | November 20, 2026 | November 20, 2026 |
| Attempt count | 4 | 2 | 4 |

The compiled merge selects the incoming lesson record when its best score is higher. It preserves the larger attempt count and earlier start date, but copies the incoming last score and update time over the newer values. The remaining stored rows and localStorage entries matched the pre-merge snapshot. This test made zero API requests.

The proposed correction keeps the higher historical best, and takes the latest attempt score and its timestamp together from the more recently updated lesson record. This uses the existing storage format. Settings implementation is paused for approval.
