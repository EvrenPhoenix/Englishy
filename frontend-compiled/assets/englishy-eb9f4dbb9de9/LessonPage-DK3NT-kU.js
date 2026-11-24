import { t as e } from "./arrow-left-CkupHnBg.js";
import {
  $ as t,
  F as n,
  I as r,
  J as i,
  L as a,
  P as o,
  Q as s,
  R as c,
  S as l,
  T as u,
  X as d,
  at as f,
  gt as p,
  n as m,
  q as h,
  ut as g,
} from "./index-CJhEbyla.js";
import { t as _ } from "./check-CbqMqHGm.js";
import { t as v } from "./chevron-right-CfUSvtRA.js";
import { i as y, t as b } from "./icons-CclmMh9Y.js";
import { t as x } from "./rotate-ccw-Bh2IGEpt.js";
import { t as S } from "./target-C-d3I1Au.js";
import { t as C } from "./trophy-Blvk5a-i.js";
import {
  E as w,
  F as T,
  I as E,
  P as D,
  R as O,
  a as k,
  b as A,
  d as j,
  i as M,
  o as N,
  p as ee,
  r as P,
  x as te,
} from "./brand-29nU70PD.js";
import { t as F } from "./RichText-BqTYqkrh.js";
import { expectedAnswer, t as I } from "./ExerciseView-BMlkCdrs.js";
import { n as L } from "./SpeechControls-_rI90RG2.js";
import { n as R, r as z, t as B } from "./vocab-BnTsZ2yD.js";
import { r as V } from "./data-Dz1-iQqH.js";
import { t as H } from "./useActiveTime-8b0uDf1A.js";
import { t as U } from "./useMeta-DyXxfmjF.js";
import { l as W, r as G } from "./i18n-DBb69MOl.js";
import { r as K, t as q } from "./ai-BFDFHR9h.js";
import J from "./NotFound-Blij-6Ms.js";
var Y = O(E(), 1),
  X = A(),
  Z = [
    `#14b8a6`,
    `#0f766e`,
    `#6366f1`,
    `#a855f7`,
    `#f59e0b`,
    `#f43f5e`,
    `#22c55e`,
  ];
function ne({ pieces: e = 70, duration: t = 3200 }) {
  let [n, r] = (0, Y.useState)(!0);
  (0, Y.useEffect)(() => {
    let e = setTimeout(() => r(!1), t + 1200);
    return () => clearTimeout(e);
  }, [t]);
  let i = (0, Y.useMemo)(
    () =>
      Array.from({ length: e }, (e, n) => {
        let r = 6 + Math.random() * 6;
        return {
          left: `${Math.random() * 100}%`,
          width: `${r}px`,
          height: `${r * (0.4 + Math.random() * 0.8)}px`,
          background: Z[n % Z.length],
          animationDuration: `${t * (0.6 + Math.random() * 0.5)}ms`,
          animationDelay: `${Math.random() * 350}ms`,
          "--rot": `${Math.round(Math.random() * 360)}deg`,
          "--drift": `${Math.round((Math.random() - 0.5) * 220)}px`,
        };
      }),
    [e, t],
  );
  return n
    ? (0, X.jsx)(`div`, {
        className: `confetti pointer-events-none fixed inset-0 z-50 overflow-hidden`,
        "aria-hidden": !0,
        children: i.map((e, t) => (0, X.jsx)(`span`, { style: e }, t)),
      })
    : null;
}
function Q({ ids: e }) {
  let { prefs: r } = n(),
    i = m(async () => new Set((await h()).map((e) => e.id)), [`vocab`]),
    a = e.map(V).filter((e) => !!e);
  if (!a.length) return null;
  let o = a.filter((e) => !i?.has(`bank:${e.id}`));
  return (0, X.jsxs)(N, {
    className: `p-5 sm:p-6`,
    children: [
      (0, X.jsxs)(`div`, {
        className: `mb-3 flex flex-wrap items-center justify-between gap-2`,
        children: [
          (0, X.jsxs)(`div`, {
            children: [
              (0, X.jsx)(`h2`, {
                className: `font-semibold`,
                children: `Words from this lesson`,
              }),
              (0, X.jsx)(`p`, {
                className: `text-sm text-muted`,
                children: `Save words to review them with flashcards.`,
              }),
            ],
          }),
          o.length > 1 &&
            (0, X.jsx)(M, {
              size: `sm`,
              variant: `soft`,
              icon: R,
              onClick: () => void t(o.map((e) => B(e, r.nativeLanguage))),
              children: `Save all`,
            }),
        ],
      }),
      (0, X.jsx)(`ul`, {
        className: `grid grid-cols-1 gap-2 sm:grid-cols-2`,
        children: a.map((e) => {
          let t = i?.has(`bank:${e.id}`),
            n =
              r.nativeLanguage !== `en` && r.nativeLanguage !== `other`
                ? e.translations[r.nativeLanguage]
                : void 0;
          return (0, X.jsxs)(
            `li`,
            {
              className: `flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border px-3.5 py-2.5`,
              children: [
                (0, X.jsxs)(`div`, {
                  className: `min-w-0`,
                  children: [
                    (0, X.jsxs)(`p`, {
                      className: `font-medium`,
                      lang: `en`,
                      children: [
                        e.word,
                        ` `,
                        (0, X.jsx)(`span`, {
                          className: `text-xs font-normal text-muted`,
                          children: e.pos,
                        }),
                      ],
                    }),
                    (0, X.jsx)(`p`, {
                      className: `truncate text-sm text-muted`,
                      children: n
                        ? (0, X.jsx)(`span`, {
                            lang: r.nativeLanguage,
                            children: n,
                          })
                        : e.definition,
                    }),
                  ],
                }),
                (0, X.jsxs)(`div`, {
                  className: `flex shrink-0 items-center gap-1`,
                  children: [
                    (0, X.jsx)(L, {
                      text: e.word,
                      label: ``,
                      size: `sm`,
                      revealFallback: !1,
                    }),
                    (0, X.jsx)(M, {
                      size: `sm`,
                      variant: t ? `ghost` : `secondary`,
                      icon: t ? z : R,
                      disabled: t,
                      onClick: () => void s(B(e, r.nativeLanguage)),
                      "aria-label": t ? `${e.word} saved` : `Save ${e.word}`,
                      children: (0, X.jsx)(`span`, {
                        className: `sr-only sm:not-sr-only`,
                        children: t ? `Saved` : `Save`,
                      }),
                    }),
                  ],
                }),
              ],
            },
            e.id,
          );
        }),
      }),
    ],
  });
}
function $() {
  let { lessonId: e = `` } = T(),
    t = l(e);
  return t ? (0, X.jsx)(re, { lesson: t }, t.id) : (0, X.jsx)(J, {});
}
function loadLessonDraft(lesson, key) {
  try {
    const draft = JSON.parse(localStorage.getItem(key));
    if (draft?.version !== 1 ||
        !Number.isInteger(draft.index) ||
        draft.index < 0 ||
        draft.index >= lesson.exercises.length ||
        draft.exerciseIds !== lesson.exercises.map(({id}) => id).join("|") ||
        !draft.outcomes || typeof draft.outcomes !== "object") return null;
    const outcomes = {};
    for (const {id} of lesson.exercises.slice(0, draft.index + 1)) {
      const result = draft.outcomes[id];
      if (result && typeof result.correct === "boolean") {
        outcomes[id] = {
          correct: result.correct,
          skipped: result.skipped === true,
          deviceSkip: result.deviceSkip === true,
          given: typeof result.given === "string" ? result.given : undefined,
          expected: typeof result.expected === "string" ? result.expected : undefined,
        };
      }
    }
    return {index: draft.index, outcomes};
  } catch {
    return null;
  }
}
function re({ lesson: t }) {
  const draftKey = `ln-lesson-draft:${t.id}`;
  const [draft] = (0, Y.useState)(() => loadLessonDraft(t, draftKey));
  const persistDraft = (index, outcomes) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        version: 1, index, outcomes,
        exerciseIds: t.exercises.map(({id}) => id).join("|"),
      }));
    } catch {
      // Storage can be disabled. The current lesson remains usable in memory.
    }
  };
  let o = G(),
    s = D(),
    { prefs: l } = n(),
    p = H(),
    [m, h] = (0, Y.useState)(draft ? `practice` : `intro`),
    [y, T] = (0, Y.useState)(draft?.index ?? 0),
    [E, O] = (0, Y.useState)(draft?.outcomes ?? {}),
    [A, j] = (0, Y.useState)(null),
    L = (0, Y.useRef)(!1),
    startSavedAnswer = (0, Y.useRef)(draft?.outcomes[t.exercises[draft.index]?.id]);
  (U({
    title: t.title,
    description: t.objectives.join(`. `),
    path: `/learn/${t.id}`,
  }),
    (0, Y.useEffect)(() => void i(t.id), [t.id]));
  let R = t.exercises.length,
    z = t.exercises[y],
    B = async (e) => {
      if (L.current) return;
      L.current = !0;
      let n = t.exercises.map((t) => e[t.id]).filter(Boolean),
        r = n.filter((e) => !e.deviceSkip).length,
        i = n.filter((e) => e.correct && !e.deviceSkip).length,
        o = r ? i / r : 0;
      (await d(t.id, o),
        await c(
          t.exercises
            .filter((t) => e[t.id] && !e[t.id].deviceSkip && !e[t.id].skipped)
            .map((n) => ({
              lessonId: t.id,
              exerciseId: n.id,
              skill: t.skill,
              correct: e[n.id].correct,
              given: e[n.id].given?.slice(0, 200),
              expected: e[n.id].expected?.slice(0, 200),
            })),
        ));
      let s = i * 2 + (o >= 0.7 ? 10 : 0);
      (await a({
        type: `lesson`,
        title: t.title,
        refId: t.id,
        durationSec: Math.min(p.take(), 3600),
        xp: s,
        correct: i,
        total: r,
      }),
        j({ score: o, correct: i, counted: r, xp: s, unscored: n.length - r }),
        h(`summary`));
      try { localStorage.removeItem(draftKey); } catch {}
    },
    V = (e) => {
      const outcomes = { ...E, [z.id]: e };
      persistDraft(y, outcomes);
      O(outcomes);
    },
    W = (e) => {
      let t = { ...E, ...e };
      startSavedAnswer.current = undefined;
      if (y + 1 >= R) {
        persistDraft(y, t);
        return B(t);
      }
      persistDraft(y + 1, t);
      T(y + 1);
    },
    K = (deviceSkip) => {
      let e = E[z.id] ?? { correct: !1, skipped: !0, deviceSkip, expected: expectedAnswer(z) };
      (O((t) => ({ ...t, [z.id]: e })), W({ [z.id]: e }));
    },
    q = () => {
      startSavedAnswer.current = undefined;
      persistDraft(0, {});
      ((L.current = !1), O({}), T(0), j(null), h(`practice`));
    },
    J = b(t.icon),
    Z = u(t.id),
    $ = A ? A.score >= r : !1;
  return (0, X.jsxs)(`div`, {
    className: `mx-auto max-w-3xl`,
    children: [
      m !== `practice` &&
        (0, X.jsx)(`div`, {
          className: `mb-6`,
          children: (0, X.jsxs)(w, {
            to: `/learn`,
            className: `inline-flex items-center gap-1.5 rounded-full py-1 pe-2 text-sm text-muted hover:text-text`,
            children: [
              (0, X.jsx)(e, {
                className: `size-4 rtl:-scale-x-100`,
                "aria-hidden": !0,
              }),
              o(`nav.learn`),
            ],
          }),
        }),
      m === `intro` &&
        (0, X.jsx)(ie, {
          lesson: t,
          Icon: J,
          onStart: q,
          showNative:
            l.showTranslations === `always` ||
            (l.showTranslations === `auto` && t.level === `pre-a1`),
        }),
      m === `practice` &&
        z &&
        (0, X.jsxs)(`section`, {
          "aria-label": o(`lesson.practice`),
          className: `mx-auto max-w-2xl`,
          children: [
            (0, X.jsxs)(`div`, {
              className: `sticky top-14 z-20 -mx-4 mb-8 flex items-center gap-3 bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0`,
              children: [
                (0, X.jsx)(`button`, {
                  type: `button`,
                  onClick: () => s(`/learn`),
                  className: `grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text`,
                  "aria-label": o(`lesson.close`),
                  title: o(`lesson.close`),
                  children: (0, X.jsx)(te, {
                    className: `size-5`,
                    "aria-hidden": !0,
                  }),
                }),
                (0, X.jsx)(ee, {
                  value: y / R,
                  label: o(`lesson.question`, { current: y + 1, total: R }),
                  className: `h-2.5 flex-1`,
                }),
                (0, X.jsxs)(`span`, {
                  className: `shrink-0 text-sm text-muted tabular-nums`,
                  children: [y + 1, `/`, R],
                }),
              ],
            }),
            (0, X.jsx)(`p`, {
              className: `mb-2 text-sm font-medium text-primary-text`,
              children: t.title,
            }),
            (0, X.jsx)(
              I,
              {
                exercise: z,
                savedAnswer: startSavedAnswer.current,
                onAnswered: V,
                onContinue: () => W(),
                onSkip: K,
                isLast: y + 1 === R,
              },
              z.id,
            ),
          ],
        }),
      m === `summary` &&
        A &&
        (0, X.jsxs)(`section`, {
          "aria-labelledby": `summary-title`,
          className: `space-y-5`,
          children: [
            $ && (0, X.jsx)(ne, {}),
            (0, X.jsxs)(`div`, {
              className: `animate-fade-up px-2 pt-4 pb-6 text-center`,
              children: [
                (0, X.jsx)(`span`, {
                  className: `mx-auto grid size-20 place-items-center rounded-full text-white ${$ ? `bg-brand-mark` : `bg-accent`}`,
                  "aria-hidden": !0,
                  children: $
                    ? (0, X.jsx)(C, { className: `size-10` })
                    : (0, X.jsx)(x, {
                        className: `size-9 dark:text-[#2a1a05]`,
                      }),
                }),
                (0, X.jsx)(`h1`, {
                  id: `summary-title`,
                  className: `mt-5 text-3xl font-semibold tracking-tight`,
                  children: o($ ? `lesson.complete` : `lesson.practised`),
                }),
                (0, X.jsx)(`p`, {
                  className: `mt-2 text-lg text-muted`,
                  children: A.counted ? o(`lesson.score`, {
                    correct: A.correct,
                    total: A.counted,
                  }) : "No questions were scored in this session.",
                }),
                A.unscored > 0 && (0, X.jsx)(`p`, {
                  className: `mt-2 text-sm text-muted`,
                  children: `${A.unscored} practice-only ${A.unscored === 1 ? "question was" : "questions were"} left out of your score.`,
                }),
                (0, X.jsxs)(`div`, {
                  className: `mt-5 flex flex-wrap justify-center gap-2`,
                  children: [
                    A.counted > 0 && (0, X.jsxs)(P, {
                      tone: `primary`,
                      icon: S,
                      className: `px-3 py-1 text-sm`,
                      children: [Math.round(A.score * 100), `%`],
                    }),
                    A.xp > 0 &&
                      (0, X.jsx)(P, {
                        tone: `accent`,
                        icon: f,
                        className: `px-3 py-1 text-sm`,
                        children: o(`lesson.xp`, { n: A.xp }),
                      }),
                  ],
                }),
                !$ &&
                  (0, X.jsxs)(`p`, {
                    className: `mx-auto mt-4 max-w-md text-sm text-muted`,
                    children: [
                      o(`lesson.completeRule`),
                      ` Mistakes are part of learning.`,
                    ],
                  }),
                (0, X.jsxs)(`div`, {
                  className: `mt-7 flex flex-wrap justify-center gap-2`,
                  children: [
                    Z &&
                      (0, X.jsx)(k, {
                        to: `/learn/${Z.id}`,
                        size: `lg`,
                        iconEnd: v,
                        children: o(`lesson.nextLesson`),
                      }),
                    (0, X.jsx)(M, {
                      variant: `secondary`,
                      size: `lg`,
                      icon: x,
                      onClick: q,
                      children: o(`lesson.retry`),
                    }),
                  ],
                }),
              ],
            }),
            (0, X.jsxs)(N, {
              className: `p-5 sm:p-6`,
              children: [
                (0, X.jsx)(`h2`, {
                  className: `mb-3 font-semibold`,
                  children: o(`lesson.review`),
                }),
                (0, X.jsx)(`ul`, {
                  className: `space-y-2`,
                  children: t.review.map((e) =>
                    (0, X.jsxs)(
                      `li`,
                      {
                        className: `flex gap-2`,
                        children: [
                          (0, X.jsx)(_, {
                            className: `mt-1 size-4 shrink-0 text-success`,
                            "aria-hidden": !0,
                          }),
                          (0, X.jsx)(F, { text: e }),
                        ],
                      },
                      e,
                    ),
                  ),
                }),
                t.grammarTopic &&
                  (0, X.jsx)(k, {
                    to: `/grammar/${t.grammarTopic}`,
                    variant: `soft`,
                    size: `sm`,
                    icon: g,
                    className: `mt-4`,
                    children: `Read more in the grammar library`,
                  }),
              ],
            }),
            t.vocab && t.vocab.length > 0 && (0, X.jsx)(Q, { ids: t.vocab }),
            (0, X.jsx)(ae, { lesson: t, outcomes: E }),
          ],
        }),
    ],
  });
}
function ie({ lesson: e, Icon: t, onStart: r, showNative: i }) {
  let a = G(),
    { prefs: s } = n(),
    c = o(),
    l =
      s.nativeLanguage !== `en` && s.nativeLanguage !== `other`
        ? e.nativeTip?.[s.nativeLanguage]
        : void 0,
    [u, d] = (0, Y.useState)(null),
    [p, m] = (0, Y.useState)(null),
    [h, g] = (0, Y.useState)(!1),
    b = (0, Y.useRef)(null);
  (0, Y.useEffect)(() => () => b.current?.abort(), []);
  let x = async () => {
      (g(!0), m(null), (b.current = new AbortController()));
      try {
        await K(
          `/api/ai/explain`,
          {
            profile: c,
            topic: `lesson`,
            subject: e.title,
            detail: e.explanation.join(` `).slice(0, 780),
          },
          (e, t) => d(t),
          b.current.signal,
        );
      } catch (e) {
        m(q(e));
      } finally {
        g(!1);
      }
    },
    S = W[e.level],
    C = (0, Y.useMemo)(
      () => a(`common.minutes`, { n: e.minutes }),
      [a, e.minutes],
    );
  return (0, X.jsxs)(`article`, {
    className: `animate-fade-up space-y-5`,
    children: [
      (0, X.jsxs)(`header`, {
        className: `flex items-start gap-4`,
        children: [
          (0, X.jsx)(`span`, {
            className: `bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white`,
            "aria-hidden": !0,
            children: (0, X.jsx)(t, { className: `size-7` }),
          }),
          (0, X.jsxs)(`div`, {
            className: `min-w-0`,
            children: [
              (0, X.jsxs)(`div`, {
                className: `flex flex-wrap gap-1.5`,
                children: [
                  (0, X.jsx)(P, { tone: `primary`, children: S.code }),
                  (0, X.jsx)(P, { icon: y, children: C }),
                  (0, X.jsx)(P, { tone: `indigo`, children: e.skill }),
                ],
              }),
              (0, X.jsx)(`h1`, {
                className: `mt-2 text-3xl font-semibold tracking-tight sm:text-[2.15rem]`,
                children: e.title,
              }),
            ],
          }),
        ],
      }),
      (0, X.jsxs)(N, {
        className: `p-5 sm:p-6`,
        children: [
          (0, X.jsx)(`h2`, {
            className: `text-sm font-medium text-muted`,
            children: a(`lesson.objectives`),
          }),
          (0, X.jsx)(`ul`, {
            className: `mt-3 space-y-1.5`,
            children: e.objectives.map((e) =>
              (0, X.jsxs)(
                `li`,
                {
                  className: `flex gap-2`,
                  children: [
                    (0, X.jsx)(_, {
                      className: `mt-1 size-4 shrink-0 text-primary`,
                      "aria-hidden": !0,
                    }),
                    e,
                  ],
                },
                e,
              ),
            ),
          }),
        ],
      }),
      i &&
        l &&
        (0, X.jsxs)(`div`, {
          className: `rounded-3xl bg-indigo-soft p-5`,
          lang: s.nativeLanguage,
          dir: s.nativeLanguage === `ar` ? `rtl` : void 0,
          children: [
            (0, X.jsx)(`p`, {
              className: `mb-1 text-xs font-semibold text-indigo`,
              lang: `en`,
              dir: `ltr`,
              children: a(`common.translation`),
            }),
            (0, X.jsx)(`p`, {
              className: `text-[1.05rem] leading-relaxed`,
              children: l,
            }),
          ],
        }),
      (0, X.jsxs)(N, {
        className: `p-5 sm:p-6`,
        children: [
          (0, X.jsx)(`h2`, {
            className: `text-lg font-semibold`,
            children: a(`lesson.explanation`),
          }),
          (0, X.jsx)(`div`, {
            className: `mt-3 space-y-3 leading-relaxed`,
            children: e.explanation.map((e, t) =>
              (0, X.jsx)(`p`, { children: (0, X.jsx)(F, { text: e }) }, t),
            ),
          }),
          (0, X.jsxs)(`div`, {
            className: `mt-4`,
            children: [
              u
                ? (0, X.jsxs)(`div`, {
                    className: `rounded-2xl bg-surface-2 p-4`,
                    children: [
                      (0, X.jsxs)(`p`, {
                        className: `mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted`,
                        children: [
                          (0, X.jsx)(f, {
                            className: `size-3.5`,
                            "aria-hidden": !0,
                          }),
                          ` AI explanation · may contain mistakes`,
                        ],
                      }),
                      (0, X.jsx)(`p`, {
                        className: `whitespace-pre-wrap text-[0.95rem]`,
                        children: u,
                      }),
                    ],
                  })
                : (0, X.jsx)(M, {
                    variant: `soft`,
                    size: `sm`,
                    icon: f,
                    onClick: x,
                    disabled: h,
                    children: h ? `Asking the tutor…` : a(`lesson.explainAi`),
                  }),
              p &&
                (0, X.jsx)(`p`, {
                  className: `mt-2 text-sm text-danger`,
                  children: p,
                }),
            ],
          }),
        ],
      }),
      (0, X.jsxs)(N, {
        className: `p-5 sm:p-6`,
        children: [
          (0, X.jsx)(`h2`, {
            className: `text-lg font-semibold`,
            children: a(`lesson.examples`),
          }),
          (0, X.jsx)(`ul`, {
            className: `mt-3 divide-y divide-border`,
            children: e.examples.map((e) =>
              (0, X.jsxs)(
                `li`,
                {
                  className: `flex flex-wrap items-center justify-between gap-3 py-3`,
                  children: [
                    (0, X.jsxs)(`div`, {
                      children: [
                        (0, X.jsx)(`p`, {
                          className: `text-[1.05rem] font-medium`,
                          lang: `en`,
                          children: e.en,
                        }),
                        e.note &&
                          (0, X.jsx)(`p`, {
                            className: `text-sm text-muted`,
                            children: e.note,
                          }),
                      ],
                    }),
                    (0, X.jsx)(L, {
                      text: e.en,
                      label: a(`common.listen`),
                      size: `sm`,
                      revealFallback: !1,
                    }),
                  ],
                },
                e.en,
              ),
            ),
          }),
        ],
      }),
      e.vocab &&
        e.vocab.length > 0 &&
        (0, X.jsx)(Q, { ids: e.vocab, compact: !0 }),
      (0, X.jsx)(`div`, {
        className: `sticky bottom-4 z-10 flex justify-center pt-2`,
        children: (0, X.jsxs)(M, {
          size: `lg`,
          onClick: r,
          iconEnd: v,
          className: `px-8 shadow-raised`,
          children: [a(`lesson.startPractice`), ` · `, e.exercises.length],
        }),
      }),
    ],
  });
}
function ae({ lesson: e, outcomes: t }) {
  let n = e.exercises.filter(
    (e) => t[e.id] && !t[e.id].correct && !t[e.id].deviceSkip,
  );
  return n.length
    ? (0, X.jsxs)(N, {
        className: `p-5 sm:p-6`,
        children: [
          (0, X.jsx)(`h2`, {
            className: `mb-1 font-semibold`,
            children: `Worth another look`,
          }),
          (0, X.jsx)(`p`, {
            className: `mb-3 text-sm text-muted`,
            children: `Review the questions you missed or skipped.`,
          }),
          (0, X.jsx)(`ul`, {
            className: `space-y-2 text-sm`,
            children: n.map((e) =>
              (0, X.jsxs)(
                `li`,
                {
                  className: `rounded-2xl bg-surface-2 px-4 py-2.5`,
                  children: [
                    t[e.id].skipped
                      ? (0, X.jsx)(`span`, {
                          className: `text-muted`,
                          children: t[e.id].expected ? `Skipped · ` : `Skipped — ${e.prompt || "open-ended practice"}`,
                        })
                      : t[e.id].given
                        ? (0, X.jsxs)(`span`, {
                            className: `text-muted`,
                            children: [`You wrote “`, t[e.id].given, `” · `],
                          })
                        : null,
                    t[e.id].expected && (0, X.jsxs)(`span`, {
                      children: [
                        `Answer: `,
                        (0, X.jsx)(`strong`, { children: t[e.id].expected }),
                      ],
                    }),
                  ],
                },
                e.id,
              ),
            ),
          }),
          (0, X.jsx)(`div`, {
            className: `mt-4`,
            children: (0, X.jsx)(j, {
              tone: `info`,
              icon: p,
              children: `Tip: ask the AI tutor about anything you are unsure of.`,
            }),
          }),
        ],
      })
    : null;
}
export { $ as default };
