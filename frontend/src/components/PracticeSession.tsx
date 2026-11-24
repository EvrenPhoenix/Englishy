import { useRef, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import type { Exercise } from "../data/types";
import { useTranslate } from "../i18n/provider";
import { logActivity, recordResults, type ActivityType } from "../lib/activity";
import { useActiveTime } from "../lib/use-active-time";
import type { LessonOutcome } from "../lib/storage-keys";
import { Button } from "./ui";
import { ProgressBar } from "./ProgressIndicators";
import { ExerciseView } from "./ExerciseView";

/**
 * A run of exercises with a score at the end. Answers the device could not play or
 * record are left out of the score; skipped questions are not stored as results.
 */
export function PracticeSession({
  exercises,
  title,
  activityType,
  refId,
  lessonIdFor,
  skill = "grammar",
  onDone,
}: {
  exercises: Exercise[];
  title: string;
  activityType: ActivityType;
  refId?: string;
  lessonIdFor?: (exercise: Exercise) => string;
  skill?: string;
  onDone?: () => void;
}) {
  const t = useTranslate();
  const activeTime = useActiveTime();
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<string, LessonOutcome>>({});
  const [finished, setFinished] = useState(false);
  const saved = useRef(false);
  const exercise = exercises[index];

  const finish = async (all: Record<string, LessonOutcome>) => {
    setFinished(true);
    if (saved.current) return;
    saved.current = true;
    const scored = exercises.filter((e) => all[e.id] && !all[e.id].deviceSkip);
    const correct = scored.filter((e) => all[e.id].correct).length;
    await recordResults(
      scored
        .filter((e) => !all[e.id].skipped)
        .map((e) => ({
          lessonId: lessonIdFor?.(e) ?? refId ?? "practice",
          exerciseId: e.id,
          skill,
          correct: all[e.id].correct,
          given: all[e.id].given?.slice(0, 200),
          expected: all[e.id].expected?.slice(0, 200),
        })),
    );
    await logActivity({
      type: activityType,
      title,
      refId,
      durationSec: Math.min(activeTime.take(), 3600),
      xp: correct * 2,
      correct,
      total: scored.length,
    });
    onDone?.();
  };
  const advance = (extra?: Record<string, LessonOutcome>) => {
    const all = { ...outcomes, ...extra };
    if (index + 1 >= exercises.length) void finish(all);
    else setIndex(index + 1);
  };

  if (!exercises.length) return null;
  if (finished) {
    const scored = exercises.filter(
      (e) => outcomes[e.id] && !outcomes[e.id].deviceSkip,
    );
    const correct = scored.filter((e) => outcomes[e.id].correct).length;
    return (
      <div className="card p-6 text-center">
        <Trophy className="mx-auto size-10 text-accent" aria-hidden />
        <p className="mt-3 text-lg font-semibold">
          {t("lesson.score", { correct, total: scored.length })}
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          icon={RotateCcw}
          onClick={() => {
            saved.current = false;
            setOutcomes({});
            setIndex(0);
            setFinished(false);
          }}
        >
          {t("lesson.retry")}
        </Button>
      </div>
    );
  }
  const position = t("lesson.question", {
    current: index + 1,
    total: exercises.length,
  });
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>{title}</span>
        <span>{position}</span>
      </div>
      <ProgressBar
        value={index / exercises.length}
        label={position}
        className="mb-4"
      />
      <div className="card p-5 sm:p-6">
        <ExerciseView
          key={exercise.id}
          exercise={exercise}
          isLast={index + 1 === exercises.length}
          onAnswered={(outcome) =>
            setOutcomes((all) => ({ ...all, [exercise.id]: outcome }))
          }
          onContinue={() => advance()}
          onSkip={(deviceSkip) => {
            const outcome = outcomes[exercise.id] ?? {
              correct: false,
              skipped: true,
              deviceSkip,
            };
            setOutcomes((all) => ({ ...all, [exercise.id]: outcome }));
            advance({ [exercise.id]: outcome });
          }}
        />
      </div>
    </div>
  );
}
