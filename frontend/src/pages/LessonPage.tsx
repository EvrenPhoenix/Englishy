import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  ChevronRight,
  Clock,
  Library,
  BookMarked,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { LEVEL_LABELS } from "../../../shared/constants";
import type { Lesson } from "../data/types";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import { Badge } from "../components/PageElements";
import { Button, ButtonLink } from "../components/FormControls";
import { Notice } from "../components/Controls";
import { ProgressBar } from "../components/ProgressIndicators";
import { RichText } from "../components/RichText";
import { ListenButton } from "../components/SpeechControls";
import {
  ExerciseView,
  expectedAnswer,
  type ExerciseOutcome,
} from "../components/ExerciseView";
import { contentIcon } from "../components/content-icons";
import { usePageMeta } from "../lib/use-page-meta";
import { useAiProfile } from "../lib/use-ai-profile";
import { useActiveTime } from "../lib/use-active-time";
import { useStoredValue } from "../lib/use-stored-value";
import { logActivity, recordResults } from "../lib/activity";
import { aiErrorMessage, streamText } from "../lib/ai";
import { findLesson } from "../lib/course";
import {
  PASS_SCORE,
  clearLessonDraft,
  lessonAfter,
  loadLessonDraft,
  markLessonStarted,
  recordLessonAttempt,
  saveLessonDraft,
} from "../lib/lesson-progress";
import { learnerDatabase, type LessonOutcome } from "../lib/storage-keys";
import {
  findBankWord,
  readVocab,
  saveWord,
  saveWords,
  wordFromBank,
} from "../lib/vocab";
import { NotFound } from "./NotFound";

const confettiColours = [
  "#14b8a6",
  "#0f766e",
  "#6366f1",
  "#a855f7",
  "#f59e0b",
  "#f43f5e",
  "#22c55e",
];

/** A short burst of confetti for a completed lesson. */
function Confetti({
  pieces = 70,
  duration = 3200,
}: {
  pieces?: number;
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration + 1200);
    return () => clearTimeout(timer);
  }, [duration]);
  const styles = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        const size = 6 + Math.random() * 6;
        return {
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size * (0.4 + Math.random() * 0.8)}px`,
          background: confettiColours[i % confettiColours.length],
          animationDuration: `${duration * (0.6 + Math.random() * 0.5)}ms`,
          animationDelay: `${Math.random() * 350}ms`,
          "--rot": `${Math.round(Math.random() * 360)}deg`,
          "--drift": `${Math.round((Math.random() - 0.5) * 220)}px`,
        } as React.CSSProperties;
      }),
    [pieces, duration],
  );
  return visible ? (
    <div
      className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {styles.map((style, i) => (
        <span key={i} style={style} />
      ))}
    </div>
  ) : null;
}

const savedWordIds = async () =>
  new Set((await readVocab()).map((word) => word.id));

/** Bank words used in a lesson, each with a save button. */
function LessonWords({ ids }: { ids: string[] }) {
  const { prefs } = usePreferences();
  const saved = useStoredValue(
    learnerDatabase.stores.vocab,
    savedWordIds,
    undefined,
  );
  const words = ids.map(findBankWord).filter((word) => !!word);
  if (!words.length) return null;
  const unsaved = words.filter((word) => !saved?.has(`bank:${word.id}`));
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Words from this lesson</h2>
          <p className="text-sm text-muted">
            Save words to review them with flashcards.
          </p>
        </div>
        {unsaved.length > 1 && (
          <Button
            size="sm"
            variant="soft"
            icon={BookmarkPlus}
            onClick={() =>
              void saveWords(
                unsaved.map((word) => wordFromBank(word, prefs.nativeLanguage)),
              )
            }
          >
            Save all
          </Button>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {words.map((word) => {
          const isSaved = saved?.has(`bank:${word.id}`);
          const translation =
            prefs.nativeLanguage !== "en" && prefs.nativeLanguage !== "other"
              ? word.translations[prefs.nativeLanguage]
              : undefined;
          return (
            <li
              key={word.id}
              className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-medium" lang="en">
                  {word.word}{" "}
                  <span className="text-xs font-normal text-muted">
                    {word.pos}
                  </span>
                </p>
                <p className="truncate text-sm text-muted">
                  {translation ? (
                    <span lang={prefs.nativeLanguage}>{translation}</span>
                  ) : (
                    word.definition
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ListenButton
                  text={word.word}
                  label=""
                  size="sm"
                  revealFallback={false}
                />
                <Button
                  size="sm"
                  variant={isSaved ? "ghost" : "secondary"}
                  icon={isSaved ? BookmarkCheck : BookmarkPlus}
                  disabled={isSaved}
                  onClick={() =>
                    void saveWord(wordFromBank(word, prefs.nativeLanguage))
                  }
                  aria-label={
                    isSaved ? `${word.word} saved` : `Save ${word.word}`
                  }
                >
                  <span className="sr-only sm:not-sr-only">
                    {isSaved ? "Saved" : "Save"}
                  </span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const lesson = findLesson(lessonId);
  return lesson ? <LessonRun key={lesson.id} lesson={lesson} /> : <NotFound />;
}

interface Summary {
  score: number;
  correct: number;
  counted: number;
  xp: number;
  unscored: number;
}

function LessonRun({ lesson }: { lesson: Lesson }) {
  // A saved draft resumes practice at the question the learner left.
  const [draft] = useState(() => loadLessonDraft(lesson));
  const t = useTranslate();
  const navigate = useNavigate();
  const { prefs } = usePreferences();
  const activeTime = useActiveTime();
  const [view, setView] = useState<"intro" | "practice" | "summary">(
    draft ? "practice" : "intro",
  );
  const [index, setIndex] = useState(draft?.index ?? 0);
  const [outcomes, setOutcomes] = useState<Record<string, LessonOutcome>>(
    draft?.outcomes ?? {},
  );
  const [summary, setSummary] = useState<Summary | null>(null);
  const finished = useRef(false);
  const resumeAnswer = useRef(
    draft?.outcomes[lesson.exercises[draft.index]?.id],
  );
  usePageMeta({
    title: lesson.title,
    description: lesson.objectives.join(". "),
    path: `/learn/${lesson.id}`,
  });
  useEffect(() => void markLessonStarted(lesson.id), [lesson.id]);

  const total = lesson.exercises.length;
  const exercise = lesson.exercises[index];
  const finish = async (all: Record<string, LessonOutcome>) => {
    if (finished.current) return;
    finished.current = true;
    const answered = lesson.exercises.map((e) => all[e.id]).filter(Boolean);
    // Questions the device could not play or record are left out of the score.
    const counted = answered.filter((o) => !o.deviceSkip).length;
    const correct = answered.filter((o) => o.correct && !o.deviceSkip).length;
    const score = counted ? correct / counted : 0;
    await recordLessonAttempt(lesson.id, score);
    await recordResults(
      lesson.exercises
        .filter((e) => all[e.id] && !all[e.id].deviceSkip && !all[e.id].skipped)
        .map((e) => ({
          lessonId: lesson.id,
          exerciseId: e.id,
          skill: lesson.skill,
          correct: all[e.id].correct,
          given: all[e.id].given?.slice(0, 200),
          expected: all[e.id].expected?.slice(0, 200),
        })),
    );
    const xp = correct * 2 + (score >= 0.7 ? 10 : 0);
    await logActivity({
      type: "lesson",
      title: lesson.title,
      refId: lesson.id,
      durationSec: Math.min(activeTime.take(), 3600),
      xp,
      correct,
      total: counted,
    });
    setSummary({
      score,
      correct,
      counted,
      xp,
      unscored: answered.length - counted,
    });
    setView("summary");
    clearLessonDraft(lesson);
  };
  const answered = (outcome: ExerciseOutcome) => {
    const next = { ...outcomes, [exercise.id]: outcome };
    saveLessonDraft(lesson, index, next);
    setOutcomes(next);
  };
  const advance = (extra?: Record<string, LessonOutcome>) => {
    const all = { ...outcomes, ...extra };
    resumeAnswer.current = undefined;
    if (index + 1 >= total) {
      saveLessonDraft(lesson, index, all);
      return finish(all);
    }
    saveLessonDraft(lesson, index + 1, all);
    setIndex(index + 1);
  };
  const skip = (deviceSkip: boolean) => {
    const outcome = outcomes[exercise.id] ?? {
      correct: false,
      skipped: true,
      deviceSkip,
      expected: expectedAnswer(exercise),
    };
    setOutcomes((all) => ({ ...all, [exercise.id]: outcome }));
    void advance({ [exercise.id]: outcome });
  };
  const restart = () => {
    resumeAnswer.current = undefined;
    saveLessonDraft(lesson, 0, {});
    finished.current = false;
    setOutcomes({});
    setIndex(0);
    setSummary(null);
    setView("practice");
  };
  const Icon = contentIcon(lesson.icon);
  const next = lessonAfter(lesson.id);
  const passed = summary ? summary.score >= PASS_SCORE : false;

  return (
    <div className="mx-auto max-w-3xl">
      {view !== "practice" && (
        <div className="mb-6">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 rounded-full py-1 pe-2 text-sm text-muted hover:text-text"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("nav.learn")}
          </Link>
        </div>
      )}
      {view === "intro" && (
        <LessonIntro
          lesson={lesson}
          Icon={Icon}
          onStart={restart}
          showNative={
            prefs.showTranslations === "always" ||
            (prefs.showTranslations === "auto" && lesson.level === "pre-a1")
          }
        />
      )}
      {view === "practice" && exercise && (
        <section
          aria-label={t("lesson.practice")}
          className="mx-auto max-w-2xl"
        >
          <div className="sticky top-14 z-20 -mx-4 mb-8 flex items-center gap-3 bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0">
            <button
              type="button"
              onClick={() => navigate("/learn")}
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
              aria-label={t("lesson.close")}
              title={t("lesson.close")}
            >
              <X className="size-5" aria-hidden />
            </button>
            <ProgressBar
              value={index / total}
              label={t("lesson.question", { current: index + 1, total })}
              className="h-2.5 flex-1"
            />
            <span className="shrink-0 text-sm text-muted tabular-nums">
              {index + 1}
              {"/"}
              {total}
            </span>
          </div>
          <p className="mb-2 text-sm font-medium text-primary-text">
            {lesson.title}
          </p>
          <ExerciseView
            key={exercise.id}
            exercise={exercise}
            savedAnswer={resumeAnswer.current}
            onAnswered={answered}
            onContinue={() => void advance()}
            onSkip={skip}
            isLast={index + 1 === total}
          />
        </section>
      )}
      {view === "summary" && summary && (
        <section aria-labelledby="summary-title" className="space-y-5">
          {passed && <Confetti />}
          <div className="animate-fade-up px-2 pt-4 pb-6 text-center">
            <span
              className={`mx-auto grid size-20 place-items-center rounded-full text-white ${passed ? "bg-brand-mark" : "bg-accent"}`}
              aria-hidden
            >
              {passed ? (
                <Trophy className="size-10" />
              ) : (
                <RotateCcw className="size-9 dark:text-[#2a1a05]" />
              )}
            </span>
            <h1
              id="summary-title"
              className="mt-5 text-3xl font-semibold tracking-tight"
            >
              {t(passed ? "lesson.complete" : "lesson.practised")}
            </h1>
            <p className="mt-2 text-lg text-muted">
              {summary.counted
                ? t("lesson.score", {
                    correct: summary.correct,
                    total: summary.counted,
                  })
                : "No questions were scored in this session."}
            </p>
            {summary.unscored > 0 && (
              <p className="mt-2 text-sm text-muted">
                {`${summary.unscored} practice-only ${summary.unscored === 1 ? "question was" : "questions were"} left out of your score.`}
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {summary.counted > 0 && (
                <Badge
                  tone="primary"
                  icon={Target}
                  className="px-3 py-1 text-sm"
                >
                  {Math.round(summary.score * 100)}
                  {"%"}
                </Badge>
              )}
              {summary.xp > 0 && (
                <Badge
                  tone="accent"
                  icon={Sparkles}
                  className="px-3 py-1 text-sm"
                >
                  {t("lesson.xp", { n: summary.xp })}
                </Badge>
              )}
            </div>
            {!passed && (
              <p className="mx-auto mt-4 max-w-md text-sm text-muted">
                {t("lesson.completeRule")}
                {" Mistakes are part of learning."}
              </p>
            )}
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {next && (
                <ButtonLink
                  to={`/learn/${next.id}`}
                  size="lg"
                  iconEnd={ChevronRight}
                >
                  {t("lesson.nextLesson")}
                </ButtonLink>
              )}
              <Button
                variant="secondary"
                size="lg"
                icon={RotateCcw}
                onClick={restart}
              >
                {t("lesson.retry")}
              </Button>
            </div>
          </div>
          <div className="card p-5 sm:p-6">
            <h2 className="mb-3 font-semibold">{t("lesson.review")}</h2>
            <ul className="space-y-2">
              {lesson.review.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check
                    className="mt-1 size-4 shrink-0 text-success"
                    aria-hidden
                  />
                  <RichText text={point} />
                </li>
              ))}
            </ul>
            {lesson.grammarTopic && (
              <ButtonLink
                to={`/grammar/${lesson.grammarTopic}`}
                variant="soft"
                size="sm"
                icon={Library}
                className="mt-4"
              >
                Read more in the grammar library
              </ButtonLink>
            )}
          </div>
          {lesson.vocab && lesson.vocab.length > 0 && (
            <LessonWords ids={lesson.vocab} />
          )}
          <MissedQuestions lesson={lesson} outcomes={outcomes} />
        </section>
      )}
    </div>
  );
}

function LessonIntro({
  lesson,
  Icon,
  onStart,
  showNative,
}: {
  lesson: Lesson;
  Icon: LucideIcon;
  onStart: () => void;
  showNative: boolean;
}) {
  const t = useTranslate();
  const { prefs } = usePreferences();
  const profile = useAiProfile();
  const nativeTip =
    prefs.nativeLanguage !== "en" && prefs.nativeLanguage !== "other"
      ? lesson.nativeTip?.[prefs.nativeLanguage]
      : undefined;
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const explain = async () => {
    setAsking(true);
    setError(null);
    request.current = new AbortController();
    try {
      await streamText(
        "/api/ai/explain",
        {
          profile,
          topic: "lesson",
          subject: lesson.title,
          detail: lesson.explanation.join(" ").slice(0, 780),
        },
        (_chunk, sofar) => setExplanation(sofar),
        request.current.signal,
      );
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setAsking(false);
    }
  };
  const minutes = useMemo(
    () => t("common.minutes", { n: lesson.minutes }),
    [t, lesson.minutes],
  );
  return (
    <article className="animate-fade-up space-y-5">
      <header className="flex items-start gap-4">
        <span
          className="bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white"
          aria-hidden
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="primary">{LEVEL_LABELS[lesson.level].code}</Badge>
            <Badge icon={Clock}>{minutes}</Badge>
            <Badge tone="indigo">{lesson.skill}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
            {lesson.title}
          </h1>
        </div>
      </header>
      <div className="card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-muted">
          {t("lesson.objectives")}
        </h2>
        <ul className="mt-3 space-y-1.5">
          {lesson.objectives.map((objective) => (
            <li key={objective} className="flex gap-2">
              <Check
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {objective}
            </li>
          ))}
        </ul>
      </div>
      {showNative && nativeTip && (
        <div
          className="rounded-3xl bg-indigo-soft p-5"
          lang={prefs.nativeLanguage}
          dir={prefs.nativeLanguage === "ar" ? "rtl" : undefined}
        >
          <p
            className="mb-1 text-xs font-semibold text-indigo"
            lang="en"
            dir="ltr"
          >
            {t("common.translation")}
          </p>
          <p className="text-[1.05rem] leading-relaxed">{nativeTip}</p>
        </div>
      )}
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t("lesson.explanation")}</h2>
        <div className="mt-3 space-y-3 leading-relaxed">
          {lesson.explanation.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
        <div className="mt-4">
          {explanation ? (
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Sparkles className="size-3.5" aria-hidden />
                {" AI explanation · may contain mistakes"}
              </p>
              <p className="whitespace-pre-wrap text-[0.95rem]">
                {explanation}
              </p>
            </div>
          ) : (
            <Button
              variant="soft"
              size="sm"
              icon={Sparkles}
              onClick={explain}
              disabled={asking}
            >
              {asking ? "Asking the tutor…" : t("lesson.explainAi")}
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </div>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t("lesson.examples")}</h2>
        <ul className="mt-3 divide-y divide-border">
          {lesson.examples.map((example) => (
            <li
              key={example.en}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-[1.05rem] font-medium" lang="en">
                  {example.en}
                </p>
                {example.note && (
                  <p className="text-sm text-muted">{example.note}</p>
                )}
              </div>
              <ListenButton
                text={example.en}
                label={t("common.listen")}
                size="sm"
                revealFallback={false}
              />
            </li>
          ))}
        </ul>
      </div>
      {lesson.vocab && lesson.vocab.length > 0 && (
        <LessonWords ids={lesson.vocab} />
      )}
      <div className="sticky bottom-4 z-10 flex justify-center pt-2">
        <Button
          size="lg"
          onClick={onStart}
          iconEnd={ChevronRight}
          className="px-8 shadow-raised"
        >
          {t("lesson.startPractice")}
          {" · "}
          {lesson.exercises.length}
        </Button>
      </div>
    </article>
  );
}

/** Questions answered wrong or skipped, with the expected answers. */
function MissedQuestions({
  lesson,
  outcomes,
}: {
  lesson: Lesson;
  outcomes: Record<string, LessonOutcome>;
}) {
  const missed = lesson.exercises.filter(
    (e) =>
      outcomes[e.id] && !outcomes[e.id].correct && !outcomes[e.id].deviceSkip,
  );
  if (!missed.length) return null;
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="mb-1 font-semibold">Worth another look</h2>
      <p className="mb-3 text-sm text-muted">
        Review the questions you missed or skipped.
      </p>
      <ul className="space-y-2 text-sm">
        {missed.map((e) => {
          const outcome = outcomes[e.id];
          return (
            <li key={e.id} className="rounded-2xl bg-surface-2 px-4 py-2.5">
              {outcome.skipped ? (
                <span className="text-muted">
                  {outcome.expected
                    ? "Skipped · "
                    : `Skipped — ${("prompt" in e && e.prompt) || "open-ended practice"}`}
                </span>
              ) : outcome.given ? (
                <span className="text-muted">
                  {"You wrote “"}
                  {outcome.given}
                  {"” · "}
                </span>
              ) : null}
              {outcome.expected && (
                <span>
                  {"Answer: "}
                  <strong>{outcome.expected}</strong>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <Notice tone="info" icon={BookMarked}>
          Tip: ask the AI tutor about anything you are unsure of.
        </Notice>
      </div>
    </div>
  );
}
