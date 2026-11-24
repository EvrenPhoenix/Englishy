import type { Lesson } from "../../data/types";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Library,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { useTranslate } from "../../i18n/provider";
import { usePreferences } from "../../components/PreferencesProvider";
import { Badge, Button, ButtonLink } from "../../components/ui";
import { ProgressBar } from "../../components/ProgressIndicators";
import { RichText } from "../../components/RichText";
import {
  ExerciseView,
  expectedAnswer,
  type ExerciseOutcome,
} from "../../components/ExerciseView";
import { contentIcon } from "../../components/content-icons";
import { usePageMeta } from "../../lib/use-page-meta";
import { useActiveTime } from "../../lib/use-active-time";
import { logActivity, recordResults } from "../../lib/activity";
import { findLesson } from "../../lib/course";
import {
  PASS_SCORE,
  clearLessonDraft,
  lessonAfter,
  loadLessonDraft,
  markLessonStarted,
  recordLessonAttempt,
  saveLessonDraft,
} from "../../lib/lesson-progress";
import { type LessonOutcome } from "../../lib/storage-keys";
import { NotFound } from "../NotFound";
import { Confetti } from "./Confetti";
import { LessonWords } from "./LessonWords";
import { LessonIntro } from "./LessonIntro";
import { MissedQuestions } from "./MissedQuestions";

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
