import { achievements } from "./achievements.ts";
import { lessons as curriculum } from "./lessons/index.ts";

interface AchievementInput {
  lessons: { lessonId: string; status: string; bestScore: number }[];
  activities: { day: string; durationSec: number; type: string }[];
  vocab: { srs: { lastReviewed: string | null; interval: number } }[];
  streaksEnabled: boolean;
}

function localDay(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function achievementProgress({
  activities,
  lessons,
  vocab,
  streaksEnabled,
}: AchievementInput) {
  const completedIds = new Set(
    lessons
      .filter((row) => row.status === "completed")
      .map((row) => row.lessonId),
  );
  const completed = curriculum.filter((lesson) => completedIds.has(lesson.id));
  const days = new Set(activities.map((activity) => activity.day));
  const cursor = new Date();
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const counts = {
    "first-lesson": completed.length,
    "five-lessons": completed.length,
    "pre-a1": completed.filter((row) => row.level === "pre-a1").length,
    a1: completed.filter((row) => row.level === "a1").length,
    perfect: Number(lessons.some((row) => row.bestScore >= 1)),
    "words-10": vocab.length,
    "mastered-10": vocab.filter(
      (row) => row.srs.lastReviewed && row.srs.interval >= 21,
    ).length,
    conversation: activities.filter((row) => row.type === "conversation")
      .length,
    writer: activities.filter((row) => row.type === "writing").length,
    hour: Math.round(
      activities.reduce((seconds, row) => seconds + row.durationSec, 0) / 60,
    ),
    "streak-7": streak,
  };
  return achievements
    .filter((row) => row.id !== "streak-7" || streaksEnabled)
    .map(({ target, id, ...metadata }) => ({
      id,
      ...metadata,
      earned: target > 0 && counts[id] >= target,
      progress: { current: Math.min(counts[id], target), target },
    }));
}
