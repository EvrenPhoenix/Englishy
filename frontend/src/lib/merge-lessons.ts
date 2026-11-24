// Lesson-progress merge for "Add to my progress (safe)". Kept free of imports so it can
// be unit-tested directly (scripts/test-merge-lessons.mjs).

export interface LessonRecord {
  lessonId: string;
  status: "started" | "completed";
  attempts: number;
  bestScore: number;
  lastScore: number;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

/**
 * Decide which incoming lesson rows to write, merged with what is on this device.
 *
 * A backup row is used when the lesson is new here, has a higher best score, or is
 * completed while the local row is not. When both exist the result keeps the higher
 * best score, the larger attempt count and the earlier start, and takes the latest
 * attempt's score and timestamp together from whichever record was updated more
 * recently. (The original release copied the backup's latest attempt over a newer
 * local one; see README "Fixes vs original app".)
 */
export function mergeLessons(
  incoming: LessonRecord[],
  existing: Map<string, Partial<LessonRecord> & { lessonId: string }>,
): LessonRecord[] {
  return incoming
    .filter((row) => {
      const current = existing.get(row.lessonId);
      return (
        !current ||
        row.bestScore > (current.bestScore ?? 0) ||
        (row.status === "completed" && current.status !== "completed")
      );
    })
    .map((row) => {
      const current = existing.get(row.lessonId);
      if (!current) return row;
      // Older local rows may predate updatedAt/lastScore; then the backup's attempt wins.
      const localIsNewer =
        current.updatedAt !== undefined &&
        current.lastScore !== undefined &&
        current.updatedAt > row.updatedAt;
      return {
        ...row,
        bestScore: Math.max(row.bestScore, current.bestScore ?? 0),
        attempts: Math.max(row.attempts, current.attempts ?? 0),
        startedAt:
          current.startedAt !== undefined && current.startedAt < row.startedAt
            ? current.startedAt
            : row.startedAt,
        ...(localIsNewer
          ? { lastScore: current.lastScore!, updatedAt: current.updatedAt! }
          : {}),
      };
    });
}
