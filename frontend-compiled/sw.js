/* Englishy service worker. The cache version and precache list are injected at build time by vite.config.ts.
   The cache prefix keeps the product's original name so caches from earlier versions are still cleaned up. */
const VERSION = 'englishy-eb9f4dbb9de9';
const CACHE = `linguanest-${VERSION}`;
const PRECACHE = ["/","/assets/englishy-eb9f4dbb9de9/index-CJhEbyla.js","/assets/englishy-eb9f4dbb9de9/Chat-DbAWiccV.js","/assets/englishy-eb9f4dbb9de9/Composer-D_Po5jtE.js","/assets/englishy-eb9f4dbb9de9/ConversationList-BKBigtTZ.js","/assets/englishy-eb9f4dbb9de9/ConversationPage-Bl06a9z3.js","/assets/englishy-eb9f4dbb9de9/Dashboard-CCpx_uau.js","/assets/englishy-eb9f4dbb9de9/ExerciseView-BMlkCdrs.js","/assets/englishy-eb9f4dbb9de9/GrammarPage-BwoVeEST.js","/assets/englishy-eb9f4dbb9de9/GrammarTopicPage-ClTbTKDv.js","/assets/englishy-eb9f4dbb9de9/Guide-g0pn2qGm.js","/assets/englishy-eb9f4dbb9de9/Help-cVwVNBeO.js","/assets/englishy-eb9f4dbb9de9/Landing-BItdrU_K.js","/assets/englishy-eb9f4dbb9de9/LearnPage-DzQmL-pN.js","/assets/englishy-eb9f4dbb9de9/LessonPage-DK3NT-kU.js","/assets/englishy-eb9f4dbb9de9/NotFound-Blij-6Ms.js","/assets/englishy-eb9f4dbb9de9/Onboarding-B8GsvFe2.js","/assets/englishy-eb9f4dbb9de9/PlacementPage-CtwonDDd.js","/assets/englishy-eb9f4dbb9de9/PracticeSession-CEKS-r7_.js","/assets/englishy-eb9f4dbb9de9/PractisePage-yQuCjgUJ.js","/assets/englishy-eb9f4dbb9de9/ProgressPage-DYdyRaYD.js","/assets/englishy-eb9f4dbb9de9/RichText-BqTYqkrh.js","/assets/englishy-eb9f4dbb9de9/Settings-Bq2QZJXQ.js","/assets/englishy-eb9f4dbb9de9/SpeakingPage-DdXS3g7D.js","/assets/englishy-eb9f4dbb9de9/SpeechControls-_rI90RG2.js","/assets/englishy-eb9f4dbb9de9/TutorPage-NIENWIWu.js","/assets/englishy-eb9f4dbb9de9/VocabularyPage-D9WZh8pR.js","/assets/englishy-eb9f4dbb9de9/WritingPage-BYUUGQRC.js","/assets/englishy-eb9f4dbb9de9/achievements-DIIZM8R4.js","/assets/englishy-eb9f4dbb9de9/ai-BFDFHR9h.js","/assets/englishy-eb9f4dbb9de9/ar-C8ALe_A1.js","/assets/englishy-eb9f4dbb9de9/arrow-left-CkupHnBg.js","/assets/englishy-eb9f4dbb9de9/arrow-right-CCU5CBRn.js","/assets/englishy-eb9f4dbb9de9/bn-C-7CTN7Z.js","/assets/englishy-eb9f4dbb9de9/book-open-DHMguvI1.js","/assets/englishy-eb9f4dbb9de9/brand-29nU70PD.js","/assets/englishy-eb9f4dbb9de9/check-CbqMqHGm.js","/assets/englishy-eb9f4dbb9de9/chevron-down-DutCit6t.js","/assets/englishy-eb9f4dbb9de9/chevron-right-CfUSvtRA.js","/assets/englishy-eb9f4dbb9de9/compass-DomQ_9Db.js","/assets/englishy-eb9f4dbb9de9/copy-CyWsEqAC.js","/assets/englishy-eb9f4dbb9de9/data-B9LX0-kj.js","/assets/englishy-eb9f4dbb9de9/data-Dz1-iQqH.js","/assets/englishy-eb9f4dbb9de9/es-CW2gzTXB.js","/assets/englishy-eb9f4dbb9de9/fr-DwWU3EqE.js","/assets/englishy-eb9f4dbb9de9/guides-Ju1Gv_OJ.js","/assets/englishy-eb9f4dbb9de9/headphones-BwEV9rwS.js","/assets/englishy-eb9f4dbb9de9/hi-D1LL7rVk.js","/assets/englishy-eb9f4dbb9de9/i18n-DBb69MOl.js","/assets/englishy-eb9f4dbb9de9/icons-CclmMh9Y.js","/assets/englishy-eb9f4dbb9de9/keyboard-Cde3fuIM.js","/assets/englishy-eb9f4dbb9de9/languages-BOjtRfCB.js","/assets/englishy-eb9f4dbb9de9/lightbulb-CFQn7oSA.js","/assets/englishy-eb9f4dbb9de9/lock-BSJRCGTV.js","/assets/englishy-eb9f4dbb9de9/pt-xqz-W8E2.js","/assets/englishy-eb9f4dbb9de9/repeat-afnhU20i.js","/assets/englishy-eb9f4dbb9de9/rotate-ccw-Bh2IGEpt.js","/assets/englishy-eb9f4dbb9de9/scenarios-CSJufgkR.js","/assets/englishy-eb9f4dbb9de9/schemas-BVJ99nmm.js","/assets/englishy-eb9f4dbb9de9/schemas-gaqX7Gro.js","/assets/englishy-eb9f4dbb9de9/search-B3TKAcgF.js","/assets/englishy-eb9f4dbb9de9/speech-Bj06CoGr.js","/assets/englishy-eb9f4dbb9de9/square-CMKK9BV1.js","/assets/englishy-eb9f4dbb9de9/target-C-d3I1Au.js","/assets/englishy-eb9f4dbb9de9/trash-BeIq4WS6.js","/assets/englishy-eb9f4dbb9de9/trophy-Blvk5a-i.js","/assets/englishy-eb9f4dbb9de9/types-XKRjlI-1.js","/assets/englishy-eb9f4dbb9de9/useActiveTime-8b0uDf1A.js","/assets/englishy-eb9f4dbb9de9/useChat-DN72XxNj.js","/assets/englishy-eb9f4dbb9de9/useMeta-DyXxfmjF.js","/assets/englishy-eb9f4dbb9de9/users-BYHRzO2M.js","/assets/englishy-eb9f4dbb9de9/validate-DkSKaKxp.js","/assets/englishy-eb9f4dbb9de9/vocab-BnTsZ2yD.js","/assets/englishy-eb9f4dbb9de9/zh-DeBN_Y9K.js","/assets/englishy-eb9f4dbb9de9/index-C9Y4pg0R.css","/assets/englishy-eb9f4dbb9de9/lexend-latin-ext-wght-normal-B6JQhE1e.woff2","/assets/englishy-eb9f4dbb9de9/lexend-latin-wght-normal-ci0D1wrL.woff2","/assets/englishy-eb9f4dbb9de9/lexend-vietnamese-wght-normal-RvljkFvg.woff2","/icons/apple-touch-icon.png","/icons/favicon.svg","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/theme-init.js"];

self.addEventListener('install', (event) => {
  // Precache the app shell and all lessons/grammar/vocabulary bundles so learning works offline.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('linguanest-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// The page asks before activating a new version, so learners are never interrupted mid-lesson.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API responses (AI replies, status). They may be personal and must stay fresh.
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          return res;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match('/', { ignoreVary: true })) || (await cache.match('/offline', { ignoreVary: true })) || Response.error();
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    // Hashed, immutable build files: cache first.
    event.respondWith(
      caches.match(req, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Other static files (icons, manifest): stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreVary: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
