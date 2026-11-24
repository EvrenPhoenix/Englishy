import * as React from "react";
import { Link, useLocation } from "react-router";
import { usePageMeta } from "../lib/use-page-meta";
import { useTranslate } from "../i18n/provider";
import { Check, ChevronRight, Lock } from "lucide-react";
import { LEVELS, LEVEL_LABELS, type Level } from "../../../shared/constants";
import { usePreferences } from "../components/PreferencesProvider";
import { classes, PageHeader, Card, ButtonLink } from "../components/ui";
import { ProgressBar, ProgressRing } from "../components/ProgressIndicators";
import { contentIcon } from "../components/content-icons";
import { useStoredValue } from "../lib/use-stored-value";
import { learnerDatabase } from "../lib/storage-keys";
import { readLessonProgress } from "../lib/database";
import { availableLevels, levelDescriptions } from "../data/course-metadata";
import {
  lessonsForUnit,
  lessonsForLevel,
  unitsForLevel,
  nextLesson,
} from "../lib/course";
import { units } from "../data/units";
export function LearnPage() {
  const translate = useTranslate();
  const { prefs } = usePreferences();
  const location = useLocation();
  usePageMeta({
    title: "Learn English step by step",
    description:
      "A structured English course from absolute beginner (Pre-A1) to A1, aligned with CEFR levels.",
    path: "/learn",
  });
  const savedLessons = useStoredValue(
    learnerDatabase.stores.lessons,
    readLessonProgress,
    undefined,
  );
  const linkedUnit = units.find((unit) => `#${unit.id}` === location.hash);
  const [linkedLevelOnEntry] = React.useState(linkedUnit?.level);
  const initialLevel =
    linkedLevelOnEntry ??
    (availableLevels.some((option) => option === prefs.level)
      ? prefs.level
      : "a1");
  const [selectedLevel, setLevel] = React.useState<Level | null>(null);
  const level = selectedLevel ?? initialLevel;
  const savedById = new Map(
    (savedLessons ?? []).map((record) => [record.lessonId, record]),
  );
  const completedIds = new Set(
    (savedLessons ?? [])
      .filter((record) => record.status === "completed")
      .map((record) => record.lessonId),
  );
  const next = nextLesson(prefs.level, completedIds);
  const available = availableLevels.some((option) => option === level);
  const levelLessons = lessonsForLevel(level);
  const completedCount = levelLessons.filter((lesson) =>
    completedIds.has(lesson.id),
  ).length;
  React.useEffect(() => {
    savedLessons &&
      linkedUnit &&
      document.getElementById(linkedUnit.id)?.scrollIntoView({
        block: "start",
      });
  }, [savedLessons, linkedUnit]);
  return (
    <div>
      <PageHeader
        title={translate("nav.learn")}
        subtitle={translate("learn.subtitle")}
      />
      <div
        role="group"
        aria-label="Levels"
        className="relative -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {LEVELS.map((option) => {
          const inCourse = availableLevels.some((item) => item === option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={level === option}
              onClick={() => setLevel(option)}
              className={classes(
                "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
                level === option
                  ? "bg-text text-bg"
                  : "bg-surface-2 hover:bg-surface-3",
                !inCourse && level !== option && "text-muted",
              )}
            >
              {!inCourse && <Lock className="size-3.5" aria-hidden={true} />}
              {LEVEL_LABELS[option].code}
              {!inCourse && (
                <span className="sr-only">
                  {" ("}
                  {translate("lesson.locked")})
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mb-8 flex items-center gap-5">
        {available && (
          <ProgressRing
            value={
              levelLessons.length ? completedCount / levelLessons.length : 0
            }
            size={68}
            stroke={6}
            label={`${completedCount} of ${levelLessons.length}`}
          >
            <span className="text-xs tabular-nums">
              {completedCount}/{levelLessons.length}
            </span>
          </ProgressRing>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            {LEVEL_LABELS[level].code}
            {" · "}
            {translate(`level.${level}`)}
          </h2>
          <p className="text-muted">{levelDescriptions[level]}</p>
        </div>
      </div>
      {available ? (
        <div className="space-y-10">
          {unitsForLevel(level).map((unit) => {
            const unitLessons = lessonsForUnit(unit.id);
            const unitCompleted = unitLessons.filter((lesson) =>
              completedIds.has(lesson.id),
            ).length;
            const unitNumber = units.indexOf(unit) + 1;
            return (
              <section
                key={unit.id}
                id={unit.id}
                aria-labelledby={`unit-${unit.id}`}
                className="scroll-mt-20"
              >
                <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 rounded-3xl bg-surface-2 p-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary-text">
                      {translate("learn.unit", {
                        n: unitNumber,
                      })}
                    </p>
                    <h3
                      id={`unit-${unit.id}`}
                      className="text-lg font-semibold tracking-tight"
                    >
                      {unit.title}
                    </h3>
                    <p className="text-sm text-muted">{unit.description}</p>
                  </div>
                  <div className="w-36">
                    <p className="mb-1.5 text-end text-xs text-muted tabular-nums">
                      {unitCompleted}/{unitLessons.length}
                    </p>
                    <ProgressBar
                      value={unitCompleted / unitLessons.length}
                      label={`${unit.title}: ${unitCompleted} of ${unitLessons.length} lessons completed`}
                      tone="success"
                      className="h-1.5"
                    />
                  </div>
                </div>
                <ol className="relative">
                  <span
                    aria-hidden={true}
                    className="absolute top-8 bottom-8 w-0.5 rounded-full bg-border"
                    style={{
                      insetInlineStart: "calc(1.875rem - 1px)",
                    }}
                  />
                  {unitLessons.map((lesson) => {
                    const record = savedById.get(lesson.id);
                    const Icon = contentIcon(lesson.icon);
                    const completed = record?.status === "completed";
                    const upNext = next?.id === lesson.id;
                    return (
                      <li key={lesson.id} className="relative">
                        <Link
                          to={`/learn/${lesson.id}`}
                          className={classes(
                            "group flex items-center gap-4 rounded-2xl p-2 pe-3 transition-colors hover:bg-surface-2",
                            upNext && "bg-primary-soft/50",
                          )}
                        >
                          <span
                            aria-hidden={true}
                            className={classes(
                              "relative z-10 grid size-11 shrink-0 place-items-center rounded-full ring-4 ring-bg",
                              completed
                                ? "bg-success text-white dark:text-[#06240f]"
                                : upNext
                                  ? "bg-brand-mark animate-pulse-ring text-white"
                                  : "bg-surface-2 text-muted",
                            )}
                          >
                            {completed ? (
                              <Check className="size-5" strokeWidth={2.6} />
                            ) : (
                              <Icon className="size-5" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 py-1">
                            <span className="block leading-snug font-medium group-hover:text-primary-text">
                              {lesson.title}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                              <span>
                                {translate("common.minutes", {
                                  n: lesson.minutes,
                                })}
                              </span>
                              {completed ? (
                                <span className="font-medium text-success">
                                  {"· "}
                                  {translate("lesson.completed")}
                                  {" · "}
                                  {Math.round(record.bestScore * 100)}%
                                </span>
                              ) : record ? (
                                <span className="font-medium text-accent">
                                  {"· "}
                                  {translate("lesson.inProgress")}
                                </span>
                              ) : null}
                              {upNext && (
                                <span className="font-medium text-primary-text">
                                  {"· "}
                                  {translate("learn.upNext")}
                                </span>
                              )}
                            </span>
                          </span>
                          <ChevronRight
                            className="size-5 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100 rtl:-scale-x-100"
                            aria-hidden={true}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-muted"
              aria-hidden={true}
            >
              <Lock className="size-5" />
            </span>
            <div>
              <p className="font-semibold">
                {LEVEL_LABELS[level].code}
                {" · "}
                {translate("learn.planned")}
              </p>
              <p className="mt-1 text-muted">
                This release includes a complete Pre-A1 and A1 course. Higher
                levels are planned. Meanwhile, you can practise at your level
                with the AI tutor, conversation scenarios (several are written
                for A2 and B1), the writing assistant and the grammar library.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink to="/conversation">
                  Conversation practice
                </ButtonLink>
                <ButtonLink to="/grammar" variant="secondary">
                  Grammar library
                </ButtonLink>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
