import type { Lesson } from "../../data/types";
import { BookMarked } from "lucide-react";
import { Notice } from "../../components/ui";
import { type LessonOutcome } from "../../lib/storage-keys";

/** Questions answered wrong or skipped, with the expected answers. */
export function MissedQuestions({
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
