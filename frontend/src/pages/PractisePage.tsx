import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  BookMarked,
  Headphones,
  Mic,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
} from "lucide-react";
import { generatedExerciseSchema } from "../../../shared/schemas";
import { lessons } from "../data/lessons";
import { grammar } from "../data/grammar";
import type { Exercise } from "../data/types";
import { useTranslate } from "../i18n/provider";
import { Badge, PageHeader } from "../components/PageElements";
import { Button, ButtonLink } from "../components/FormControls";
import { Notice } from "../components/Controls";
import { PracticeSession } from "../components/PracticeSession";
import { usePageMeta } from "../lib/use-page-meta";
import { useAiProfile } from "../lib/use-ai-profile";
import { useOnline } from "../lib/use-online";
import { useStoredValue } from "../lib/use-stored-value";
import { readProgressRecords } from "../lib/database";
import { learnerDatabase } from "../lib/storage-keys";
import { revisionTopics } from "../lib/progress-stats";
import { seedFromId, seededShuffle } from "../lib/validate";
import { aiErrorMessage, postJson } from "../lib/ai";

/** Every course and grammar exercise by id, with the lesson its results belong to. */
const exerciseIndex = new Map<
  string,
  { exercise: Exercise; lessonId: string }
>();
for (const lesson of lessons)
  for (const exercise of lesson.exercises)
    exerciseIndex.set(exercise.id, { exercise, lessonId: lesson.id });
for (const topic of grammar)
  for (const exercise of topic.exercises)
    exerciseIndex.set(exercise.id, {
      exercise,
      lessonId: `grammar:${topic.id}`,
    });

/** Types that work without audio or free writing. */
const reviewable = new Set<Exercise["type"]>([
  "mc",
  "blank",
  "order",
  "spot",
  "correct",
  "recall",
  "match",
  "translate",
]);

interface Session {
  title: string;
  exercises: Exercise[];
  type: "review";
  ai?: boolean;
}

const stores = [
  learnerDatabase.stores.results,
  learnerDatabase.stores.lessons,
] as const;

export function PractisePage() {
  const t = useTranslate();
  usePageMeta({ title: t("nav.practise"), noindex: true });
  const read = useCallback(async () => {
    const { results, lessons: progress } = await readProgressRecords();
    return { results, lessons: progress };
  }, []);
  const records = useStoredValue(stores, read, undefined);
  const [session, setSession] = useState<Session | null>(null);

  // Questions whose most recent answer was wrong.
  const mistakes = useMemo(() => {
    if (!records) return [];
    const latest = new Map<string, boolean>();
    for (const result of records.results)
      if (!latest.has(result.exerciseId))
        latest.set(result.exerciseId, result.correct);
    return [...latest.entries()]
      .filter(([, correct]) => !correct)
      .map(([id]) => exerciseIndex.get(id)?.exercise)
      .filter(
        (exercise): exercise is Exercise =>
          !!exercise && reviewable.has(exercise.type),
      )
      .slice(0, 10);
  }, [records]);
  // Ten questions from started lessons (or the first lessons), reshuffled daily.
  const mixed = useMemo(() => {
    if (!records) return [];
    const started = new Set(records.lessons.map((row) => row.lessonId));
    const fromStarted = lessons
      .filter((lesson) => started.has(lesson.id))
      .flatMap((lesson) =>
        lesson.exercises.filter((e) => reviewable.has(e.type)),
      );
    const pool =
      fromStarted.length >= 5
        ? fromStarted
        : lessons
            .slice(0, 4)
            .flatMap((lesson) =>
              lesson.exercises.filter((e) => reviewable.has(e.type)),
            );
    return seededShuffle(pool, seedFromId(new Date().toDateString())).slice(
      0,
      10,
    );
  }, [records]);
  const topics = records ? revisionTopics(records.results) : [];

  if (session)
    return (
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => setSession(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />{" "}
          {t("nav.practise")}
        </button>
        {session.ai && (
          <div className="mb-4">
            <Notice tone="info" title="AI-generated questions">
              These questions were written by AI and checked automatically for
              format. They may occasionally contain mistakes.
            </Notice>
          </div>
        )}
        <PracticeSession
          exercises={session.exercises}
          title={session.title}
          activityType={session.type}
          refId={session.ai ? "ai-practice" : "practice"}
          lessonIdFor={(exercise) =>
            exerciseIndex.get(exercise.id)?.lessonId ?? "ai-practice"
          }
          skill="review"
          onDone={() => {}}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.practise")}
        subtitle="Short, focused practice built from what you have actually studied."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <RotateCcw className="size-6 text-accent" aria-hidden />
          <h2 className="mt-3 font-semibold">Review your mistakes</h2>
          <p className="mt-1 text-sm text-muted">
            {mistakes.length
              ? `${mistakes.length} question${mistakes.length > 1 ? "s" : ""} you answered incorrectly last time.`
              : "No open mistakes. When you get something wrong, it will appear here."}
          </p>
          <Button
            className="mt-4"
            disabled={!mistakes.length}
            onClick={() =>
              setSession({
                title: "Mistake review",
                exercises: mistakes,
                type: "review",
              })
            }
          >
            Start review
          </Button>
        </div>
        <div className="card p-5">
          <Shuffle className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Mixed review</h2>
          <p className="mt-1 text-sm text-muted">
            Ten questions from lessons you have started (or the first lessons if
            you are new).
          </p>
          <Button
            className="mt-4"
            disabled={!mixed.length}
            onClick={() =>
              setSession({
                title: "Mixed review",
                exercises: mixed,
                type: "review",
              })
            }
          >
            Start mixed review
          </Button>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Target className="size-5 text-accent" aria-hidden />
          {" Topics to revise"}
        </h2>
        {topics.length ? (
          <ul className="mt-3 divide-y divide-border">
            {topics.map((topic) => (
              <li
                key={topic.lessonId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <Link
                  to={
                    topic.lessonId.startsWith("grammar:")
                      ? `/grammar/${topic.lessonId.slice(8)}`
                      : `/learn/${topic.lessonId}`
                  }
                  className="font-medium hover:text-primary-text"
                >
                  {topic.title}
                </Link>
                <Badge tone="accent">
                  {Math.round(topic.accuracy * 100)}
                  {"% of "}
                  {topic.attempts}
                  {" recent answers"}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            When a topic has several recent mistakes (under 70% correct), we
            will suggest it here.
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/vocabulary?review=1" className="card p-5 card-hover">
          <BookMarked className="size-6 text-indigo" aria-hidden />
          <p className="mt-3 font-semibold">Flashcards</p>
          <p className="text-sm text-muted">
            Review saved words with spaced repetition.
          </p>
        </Link>
        <Link to="/speaking" className="card p-5 card-hover">
          <Headphones className="size-6 text-primary" aria-hidden />
          <p className="mt-3 font-semibold">Listening</p>
          <p className="text-sm text-muted">
            Hear words and sentences, then choose or type.
          </p>
        </Link>
        <Link to="/speaking?tab=speak" className="card p-5 card-hover">
          <Mic className="size-6 text-accent" aria-hidden />
          <p className="mt-3 font-semibold">Speaking</p>
          <p className="text-sm text-muted">Repeat sentences and read aloud.</p>
        </Link>
      </div>
      <CustomPractice onStart={setSession} />
    </div>
  );
}

/** Five AI-written multiple-choice questions on a topic the learner types. */
function CustomPractice({ onStart }: { onStart: (session: Session) => void }) {
  const profile = useAiProfile();
  const online = useOnline();
  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const raw = await postJson("/api/ai/exercises", {
        profile,
        topic: topic.trim(),
        count: 5,
      });
      const parsed = generatedExerciseSchema.safeParse(raw);
      if (!parsed.success) throw Error("invalid");
      const stamp = Date.now();
      const exercises: Exercise[] = parsed.data.exercises
        .filter((q) => q.answerIndex < q.options.length)
        .map((q, i) => ({
          id: `ai:${stamp}:${i}`,
          type: "mc",
          prompt: q.question,
          options: q.options,
          answer: q.answerIndex,
          explanation: q.explanation,
        }));
      if (!exercises.length) throw Error("empty");
      onStart({
        title: `AI practice: ${topic.trim()}`,
        exercises,
        type: "review",
        ai: true,
      });
    } catch (err) {
      setError(
        err instanceof Error &&
          (err.message === "invalid" || err.message === "empty")
          ? "The AI returned questions we could not check. Please try again."
          : aiErrorMessage(err),
      );
    } finally {
      setCreating(false);
    }
  };
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Sparkles className="size-5 text-indigo" aria-hidden />
        {" Custom practice with AI "}
        <Badge>{online ? "Needs internet" : "Offline"}</Badge>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Type a topic, for example "past simple irregular verbs" or "words for
        the kitchen", and get five multiple-choice questions at your level.
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (topic.trim().length >= 2) void create();
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Practice topic</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            maxLength={120}
            placeholder="Topic"
            className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3"
          />
        </label>
        <Button
          type="submit"
          disabled={creating || topic.trim().length < 2 || !online}
        >
          {creating ? "Creating questions…" : "Create questions"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {!online && (
        <div className="mt-3">
          <ButtonLink to="/learn" variant="ghost" size="sm">
            Continue with lessons instead
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
