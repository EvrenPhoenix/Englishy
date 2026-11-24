import type { Level } from "../../../shared/constants";
import { lessons } from "../data/lessons";
import { units } from "../data/units";
export const lessonsForUnit = (id: string) =>
  lessons.filter((lesson) => lesson.unitId === id);
export const unitsForLevel = (level: Level) =>
  units.filter((unit) => unit.level === level);
export const lessonsForLevel = (level: Level) =>
  lessons.filter((lesson) => lesson.level === level);
export function nextLesson(level: Level, completed: Set<string>) {
  const start = lessons.findIndex(
    (lesson) => lesson.level === (level === "pre-a1" ? "pre-a1" : "a1"),
  );
  return (
    lessons
      .slice(Math.max(0, start))
      .find((lesson) => !completed.has(lesson.id)) ??
    lessons.find((lesson) => !completed.has(lesson.id))
  );
}
