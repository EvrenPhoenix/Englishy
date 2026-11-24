import { Link } from "react-router";
import { usePageMeta } from "../lib/use-page-meta";
import { useTranslate } from "../i18n/provider";
import { LEVEL_LABELS } from "../../../shared/constants";
import { Flame, Target } from "lucide-react";
import { usePreferences } from "../components/PreferencesProvider";
import { ButtonLink, Badge, Card, PageHeader, classes } from "../components/ui";
import { ActivityChart } from "../components/ActivityChart";
import { ProgressBar } from "../components/ProgressIndicators";
import { contentIcon } from "../components/content-icons";
import { units } from "../data/units";
import { achievementProgress } from "../data/achievement-progress";
import { lessonsForUnit, nextLesson, findLesson } from "../lib/course";
import { useStoredValue } from "../lib/use-stored-value";
import { readProgressRecords, progressStores } from "../lib/database";
import {
  weekStats,
  dailyTotals,
  vocabCounts,
  revisionTopics,
  courseProgress,
  totalMinutes,
  totalXp,
  currentStreak,
  bestStreak,
} from "../lib/progress-stats";
export function ProgressPage() {
  const translate = useTranslate();
  const { prefs } = usePreferences();
  usePageMeta({
    title: translate("nav.progress"),
    noindex: true,
  });
  const records = useStoredValue(
    progressStores,
    readProgressRecords,
    undefined,
  );
  if (!records)
    return (
      <div
        className="animate-pulse rounded-2xl bg-surface-2 h-96 w-full"
        aria-hidden
      />
    );
  const { activities, lessons, vocab, results } = records;
  const course = courseProgress(lessons);
  const week = weekStats(activities);
  const days = dailyTotals(activities, 14);
  const mastery = vocabCounts(vocab);
  const awards = achievementProgress({
    activities,
    lessons,
    vocab,
    streaksEnabled: prefs.streaksEnabled,
  });
  const revision = revisionTopics(results);
  const next = nextLesson(prefs.level, course.completed);
  const recent = lessons
    .filter(
      (
        row,
      ): row is typeof row & {
        completedAt: string;
      } => Boolean(row.completedAt),
    )
    .sort((first, second) =>
      (second.completedAt ?? "").localeCompare(first.completedAt ?? ""),
    )
    .slice(0, 5);
  const stats = [
    {
      label: "Lessons completed",
      value: `${course.completedCount}`,
      sub: `of ${course.total}`,
    },
    {
      label: "Total learning time",
      value: `${totalMinutes(activities)}`,
      sub: "minutes",
    },
    {
      label: "Words saved",
      value: `${vocab.length}`,
      sub: `${mastery.mastered} mastered`,
    },
    {
      label: "Experience",
      value: `${totalXp(activities)}`,
      sub: "XP from activities",
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title={translate("nav.progress")}
        subtitle="Everything here is calculated from what you have done on this device. Nothing is estimated."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {stat.value}
            </p>
            <p className="text-sm text-muted">{stat.sub}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold">
            Minutes learned per day · last 14 days
          </h2>
          <p className="text-sm text-muted">
            {"Active time in lessons and practice. Your daily goal is "}
            {prefs.dailyGoalMinutes}
            {" minutes."}
          </p>
          <div className="mt-3">
            <ActivityChart days={days} goal={prefs.dailyGoalMinutes} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">This week</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              [
                "Minutes",
                week.minutes,
                week.previousMinutes
                  ? `last week: ${week.previousMinutes}`
                  : "",
              ],
              ["Active days", week.days, "of 7"],
              ["Lessons", week.lessons, ""],
              ["Reviews", week.reviews, ""],
              ["Conversations", week.conversations, ""],
              ["Writing", week.writing, ""],
            ].map(([label, value, detail]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-2 border-b border-border pb-2 last:border-0"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold tabular-nums">
                  {value}{" "}
                  <span className="text-xs font-normal text-muted">
                    {detail}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          {prefs.streaksEnabled && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Flame className="size-4 text-accent" aria-hidden={true} />
              {" Current streak: "}
              <strong>{currentStreak(activities)}</strong>
              {" · best: "}
              {bestStreak(activities)}
              {" days"}
            </p>
          )}
        </Card>
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Course progress</h2>
          <span className="text-sm text-muted">
            {"Pre-A1 "}
            {course.preA1.completed}/{course.preA1.total}
            {" · A1 "}
            {course.a1.completed}/{course.a1.total}
          </span>
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {units.map((unit) => {
            const unitLessons = lessonsForUnit(unit.id);
            const completed = unitLessons.filter((lesson) =>
              course.completed.has(lesson.id),
            ).length;
            return (
              <li key={unit.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    <Badge className="me-1.5">
                      {LEVEL_LABELS[unit.level].code}
                    </Badge>
                    {unit.title}
                  </span>
                  <span className="text-muted tabular-nums">
                    {completed}/{unitLessons.length}
                  </span>
                </div>
                <ProgressBar
                  value={completed / unitLessons.length}
                  label={`${unit.title}: ${completed} of ${unitLessons.length}`}
                  tone="success"
                />
              </li>
            );
          })}
        </ul>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Vocabulary mastery</h2>
          {vocab.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Save words to track mastery.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {(["new", "learning", "reviewing", "mastered"] as const).map(
                (stage) => (
                  <li key={stage}>
                    <div className="mb-1 flex justify-between text-sm capitalize">
                      <span>{stage}</span>
                      <span className="tabular-nums text-muted">
                        {mastery[stage]}
                      </span>
                    </div>
                    <ProgressBar
                      value={mastery[stage] / vocab.length}
                      label={`${stage}: ${mastery[stage]} of ${vocab.length}`}
                    />
                  </li>
                ),
              )}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Mastered = next review is 21 or more days away (SM-2 spaced
            repetition).
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Target className="size-5 text-accent" aria-hidden={true} />
            {" Skills to revise"}
          </h2>
          {revision.length ? (
            <ul className="mt-2 divide-y divide-border text-sm">
              {revision.map((topic) => (
                <li
                  key={topic.lessonId}
                  className="flex justify-between gap-2 py-2"
                >
                  <Link
                    className="hover:text-primary-text"
                    to={
                      topic.lessonId.startsWith("grammar:")
                        ? `/grammar/${topic.lessonId.slice(8)}`
                        : `/learn/${topic.lessonId}`
                    }
                  >
                    {topic.title}
                  </Link>
                  <span className="text-muted">
                    {Math.round(topic.accuracy * 100)}% correct recently
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Nothing stands out. Topics appear here when recent accuracy is
              under 70%.
            </p>
          )}
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium">Recommended next step</p>
            {next ? (
              <ButtonLink to={`/learn/${next.id}`} size="sm" className="mt-2">
                {next.title}
              </ButtonLink>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Try conversation practice or writing feedback.
              </p>
            )}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Recent accomplishments</h2>
          {recent.length ? (
            <ul className="mt-2 divide-y divide-border text-sm">
              {recent.map((row) => (
                <li key={row.lessonId} className="flex justify-between py-2">
                  <Link
                    to={`/learn/${row.lessonId}`}
                    className="hover:text-primary-text"
                  >
                    {findLesson(row.lessonId)?.title ?? row.lessonId}
                  </Link>
                  <span className="text-muted">
                    {new Date(row.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Completed lessons will appear here.
            </p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Achievements</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {awards.map((award) => {
              const Icon = contentIcon(award.icon);
              return (
                <li
                  key={award.id}
                  className={classes(
                    "flex items-start gap-3 rounded-xl border p-3",
                    award.earned
                      ? "border-accent/30 bg-accent-soft"
                      : "border-border",
                  )}
                >
                  <Icon
                    className={classes(
                      "mt-0.5 size-5 shrink-0",
                      award.earned ? "text-accent" : "text-muted",
                    )}
                    aria-hidden={true}
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      {award.title}{" "}
                      {award.earned && (
                        <span className="sr-only">(earned)</span>
                      )}
                    </p>
                    <p className="text-muted">{award.description}</p>
                    {!award.earned && award.progress && (
                      <p className="mt-1 text-xs text-muted tabular-nums">
                        {award.progress.current}/{award.progress.target}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
