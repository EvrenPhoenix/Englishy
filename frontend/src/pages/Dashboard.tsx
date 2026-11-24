import * as React from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowRight,
  BookBookmark,
  Check,
  CircleCheck,
  Dumbbell,
  Flame,
  Languages,
  MessageCircle,
  PenLine,
  Sparkles,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { LEVELS, LEVEL_LABELS, LIMITS } from "../../../shared/constants";
import { units } from "../data/units";
import { lessons as curriculum } from "../data/lessons";
import { scenarios } from "../data/scenarios";
import { activityLabels } from "../data/catalogues";
import { achievementProgress } from "../data/achievement-progress";
import { useTranslate } from "../i18n/provider";
import { usePageMeta } from "../lib/use-page-meta";
import { nextLesson } from "../lib/course";
import {
  courseProgress,
  currentStreak,
  dailyTotals,
  revisionTopics,
} from "../lib/progress-stats";
import { progressStores, readProgressRecords } from "../lib/database";
import { useStoredValue } from "../lib/use-stored-value";
import { usePreferences } from "../components/PreferencesProvider";
import { classes, Badge } from "../components/PageElements";
import { ActionLink } from "../components/ActionLink";
import { Composer, Suggestion } from "../components/Composer";
import { contentIcon } from "../components/content-icons";
import { ProgressRing, ProgressBar } from "../components/ProgressIndicators";
function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={classes("animate-pulse rounded-2xl bg-surface-2", className)}
    />
  );
}
function tutorLink(message: string, send: boolean) {
  return `/tutor?new=${Date.now().toString(36)}&q=${encodeURIComponent(message.slice(0, LIMITS.messageChars))}${send ? "&send=1" : ""}`;
}
export function Dashboard() {
  const translate = useTranslate();
  const navigate = useNavigate();
  const [message, setMessage] = React.useState("");
  const [focusSignal, focusComposer] = React.useState(0);
  usePageMeta({
    title: translate("nav.home"),
    noindex: true,
  });
  const records = useStoredValue(
    progressStores,
    readProgressRecords,
    undefined,
  );
  const hour = new Date().getHours();
  const greeting = translate(
    hour < 12
      ? "dashboard.morning"
      : hour < 18
        ? "dashboard.afternoon"
        : "dashboard.evening",
  );
  const isNewLearner = records ? records.activities.length === 0 : false;
  const openTutor = (text: string, send = true) =>
    void navigate(tutorLink(text, send));
  const composer = (
    <section className="card p-5 sm:p-6" aria-labelledby={"dashboard-tutor"}>
      <div className="mx-auto max-w-3xl">
        <h2
          id={"dashboard-tutor"}
          className="text-xl font-semibold tracking-tight"
        >
          {translate("home.ask")}
        </h2>
        <Composer
          size="lg"
          className="mt-4"
          value={message}
          onChange={setMessage}
          onSubmit={() => openTutor(message.trim())}
          label={translate("chat.message")}
          placeholder={translate("home.placeholder")}
          maxLength={LIMITS.messageChars}
          focusSignal={focusSignal}
          inputLang="en"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Suggestion
            icon={Languages}
            onClick={() => openTutor(translate("home.chip1"))}
          >
            {translate("home.chip1")}
          </Suggestion>
          <Suggestion
            icon={PenLine}
            onClick={() => {
              (setMessage(translate("home.chip2Prompt")),
                focusComposer((signal) => signal + 1));
            }}
          >
            {translate("home.chip2")}
          </Suggestion>
          <Suggestion
            icon={Sparkles}
            onClick={() => openTutor(translate("home.chip3"))}
          >
            {translate("home.chip3")}
          </Suggestion>
          <Suggestion
            icon={UtensilsCrossed}
            onClick={() => void navigate("/conversation/ordering-food")}
          >
            {translate("home.chip4")}
          </Suggestion>
        </div>
      </div>
    </section>
  );
  return (
    <div>
      <h1 className="mb-5 pt-2 text-[2.1rem] leading-tight font-semibold tracking-tight sm:text-4xl">
        <span className="text-gradient">
          {isNewLearner ? translate("dashboard.welcome") : greeting}
        </span>
      </h1>
      {records ? (
        <DashboardOverview data={records} composer={composer} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-52 lg:col-span-2" />
          <Skeleton className="h-52" />
        </div>
      )}
    </div>
  );
}
function DashboardOverview({
  data,
  composer,
}: {
  data: Awaited<ReturnType<typeof readProgressRecords>>;
  composer: React.ReactNode;
}) {
  const t = useTranslate();
  const { prefs } = usePreferences();
  const { activities, lessons, vocab, results } = data;
  const course = courseProgress(lessons);
  const next = nextLesson(prefs.level, course.completed);
  const minutes = dailyTotals(activities, 1)[0].minutes;
  const goal = prefs.dailyGoalMinutes;
  const due = vocab.filter(
    (word) => new Date(word.srs.due) <= new Date(),
  ).length;
  const revision = revisionTopics(results);
  const streak = currentStreak(activities);
  const awards = achievementProgress({
    activities,
    lessons,
    vocab,
    streaksEnabled: prefs.streaksEnabled,
  });
  const earned = awards.filter((award) => award.earned);
  const closestAward = awards
    .filter((award) => !award.earned)
    .sort(
      (first, second) =>
        second.progress.current / second.progress.target -
        first.progress.current / first.progress.target,
    )[0];
  const levelIndex = LEVELS.indexOf(prefs.level);
  const scenario =
    scenarios.filter(
      (scenario) =>
        LEVELS.indexOf(scenario.minLevel) <= Math.max(levelIndex, 1),
    )[new Date().getDate() % 3] ?? scenarios[0];
  const NextIcon = next ? contentIcon(next.icon) : Trophy;
  const saved = next
    ? lessons.find((lesson) => lesson.lessonId === next.id)
    : undefined;
  const level = LEVEL_LABELS[prefs.level];
  return (
    <div className="animate-fade-up space-y-4">
      {!prefs.onboarding.completed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-indigo-soft px-5 py-4">
          <div className="min-w-0">
            <p className="font-semibold">{t("home.setupTitle")}</p>
            <p className="text-sm text-text/80">{t("home.setupBody")}</p>
          </div>
          <ActionLink to="/start" size="sm" variant="secondary" arrow>
            {t("home.setupCta")}
          </ActionLink>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <section
          className="card relative overflow-hidden p-4 sm:p-6 lg:col-span-2"
          aria-labelledby="up-next"
        >
          <p id="up-next" className="text-sm font-medium text-muted">
            {t("learn.upNext")}
          </p>
          {next ? (
            <div className="mt-4 flex items-start gap-4">
              <span
                className="bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white"
                aria-hidden={true}
              >
                <NextIcon className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  {next.title}
                </h2>
                <p className="mt-1 text-muted">
                  {next.objectives.slice(0, 2).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>{LEVEL_LABELS[next.level].code}</Badge>
                  <Badge>
                    {t("common.minutes", {
                      n: next.minutes,
                    })}
                  </Badge>
                  {saved && (
                    <Badge tone="accent">{t("lesson.inProgress")}</Badge>
                  )}
                </div>
                <ActionLink to={`/learn/${next.id}`} className="mt-4" arrow>
                  {t(saved ? "dashboard.continue" : "common.start")}
                </ActionLink>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <span
                className="bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white"
                aria-hidden={true}
              >
                <NextIcon className="size-7" />
              </span>
              <p className="font-medium">{t("home.allDone")}</p>
            </div>
          )}
          <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
            <ProgressBar
              value={course.completedCount / course.total}
              label={t("home.lessonsDone", {
                done: course.completedCount,
                total: course.total,
              })}
              className="h-1.5 flex-1"
            />
            <span className="shrink-0 text-sm text-muted">
              {t("home.lessonsDone", {
                done: course.completedCount,
                total: course.total,
              })}
            </span>
          </div>
        </section>
        <section
          className="card flex flex-col items-center p-6 text-center"
          aria-labelledby="today"
        >
          <h2
            id="today"
            className="mb-4 self-start text-sm font-medium text-muted"
          >
            {t("dashboard.todayGoal")}
          </h2>
          <ProgressRing
            value={minutes / goal}
            size={116}
            stroke={9}
            label={t("dashboard.goalProgress", {
              done: minutes,
              goal,
            })}
          >
            <span className="flex flex-col items-center leading-tight">
              {minutes >= goal ? (
                <Check
                  className="size-8 text-primary-text"
                  aria-hidden={true}
                />
              ) : (
                <span className="text-3xl font-semibold tabular-nums">
                  {minutes}
                </span>
              )}
              <span className="text-xs font-normal text-muted">
                {t("common.minutes", {
                  n: goal,
                })}
              </span>
            </span>
          </ProgressRing>
          <p className="mt-3 text-sm">
            {minutes >= goal
              ? t("dashboard.goalReached")
              : t("dashboard.goalProgress", {
                  done: minutes,
                  goal,
                })}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <Link to="/settings" className="rounded-full">
              <Badge tone="primary">
                {level.code}
                {" · "}
                {t(`level.${prefs.level}`)}
              </Badge>
            </Link>
            {prefs.streaksEnabled && streak > 0 && (
              <Badge tone="accent" icon={Flame}>
                {t("home.streak", {
                  n: streak,
                })}
              </Badge>
            )}
          </div>
        </section>
      </div>
      {composer}
      <div className="grid gap-4 sm:grid-cols-3">
        <PracticeCard
          to="/vocabulary?review=1"
          icon={BookBookmark}
          tone="indigo"
          title={t("home.review")}
          body={
            vocab.length === 0
              ? t("home.reviewNone")
              : due > 0
                ? t("home.reviewDue", {
                    n: due,
                  })
                : t("home.reviewNone")
          }
          badge={due > 0 ? String(due) : undefined}
        />
        <PracticeCard
          to="/practise"
          icon={Dumbbell}
          tone="accent"
          title={t("nav.practise")}
          body={
            revision.length
              ? `${revision.length} × ${revision[0].title}`
              : t("home.practiseBody")
          }
        />
        <PracticeCard
          to={`/conversation/${scenario.id}`}
          icon={MessageCircle}
          tone="primary"
          title={t("home.talk")}
          body={t("home.talkBody", {
            scenario: scenario.title,
          })}
        />
      </div>
      <section className="card p-6" aria-labelledby="journey">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="journey" className="font-semibold">
            {t("home.journey")}
          </h2>
          <Link
            to="/learn"
            className="rounded-full px-2 py-1 text-sm font-medium text-primary-text hover:bg-primary-soft"
          >
            {t("home.seeAll")}
          </Link>
        </div>
        <ol className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {units.map((unit, index) => {
            const unitLessons = curriculum.filter(
              (lesson) => lesson.unitId === unit.id,
            );
            const completed = unitLessons.filter((lesson) =>
              course.completed.has(lesson.id),
            ).length;
            const finished =
              unitLessons.length > 0 && completed === unitLessons.length;
            const current = next?.unitId === unit.id;
            return (
              <li key={unit.id} className="w-44 shrink-0 snap-start">
                <Link
                  to={`/learn#${unit.id}`}
                  className={classes(
                    "block h-full rounded-2xl border p-4 transition-colors",
                    current
                      ? "border-primary bg-primary-soft/60"
                      : "border-border hover:bg-surface-2",
                  )}
                >
                  <span className="flex items-center justify-between text-xs font-medium text-muted">
                    {t("learn.unit", {
                      n: index + 1,
                    })}
                    {finished && (
                      <CircleCheck
                        className="size-4 text-success"
                        aria-label={t("lesson.completed")}
                      />
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 block min-h-[2.6em] text-sm leading-snug font-semibold">
                    {unit.title}
                  </span>
                  <ProgressBar
                    value={
                      unitLessons.length ? completed / unitLessons.length : 0
                    }
                    label={`${unit.title}: ${completed}/${unitLessons.length}`}
                    className="mt-3 h-1.5"
                  />
                  <span className="mt-1.5 block text-xs text-muted tabular-nums">
                    {completed}/{unitLessons.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3" aria-labelledby="recent">
          <h2 id="recent" className="mb-3 font-semibold">
            {t("dashboard.recent")}
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted">{t("dashboard.noActivity")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {activities.slice(0, 5).map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{activity.title}</p>
                    <p className="text-muted">
                      {
                        activityLabels[
                          activity.type as keyof typeof activityLabels
                        ]
                      }
                      {" · "}
                      {new Date(activity.at).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {activity.total
                        ? ` · ${activity.correct}/${activity.total}`
                        : ""}
                    </p>
                  </div>
                  {activity.xp > 0 && (
                    <Badge tone="primary">
                      {t("lesson.xp", {
                        n: activity.xp,
                      })}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          className="card p-6 lg:col-span-2"
          aria-labelledby="achievements"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="achievements" className="font-semibold">
              {t("dashboard.achievements")}
            </h2>
            <Link
              to="/progress"
              className="rounded-full px-2 py-1 text-sm font-medium text-primary-text hover:bg-primary-soft"
            >
              {earned.length}/{awards.length}
            </Link>
          </div>
          {earned.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2">
              {earned.slice(0, 8).map((award) => {
                const Icon = contentIcon(award.icon);
                return (
                  <li
                    key={award.id}
                    title={award.title}
                    className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"
                  >
                    <Icon className="size-5" aria-hidden={true} />
                    <span className="sr-only">{award.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {closestAward && (
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Trophy
                  className="size-4 shrink-0 text-accent"
                  aria-hidden={true}
                />
                {closestAward.title}
              </p>
              <ProgressBar
                value={
                  closestAward.progress.current / closestAward.progress.target
                }
                tone="accent"
                label={`${closestAward.title}: ${closestAward.progress.current}/${closestAward.progress.target}`}
                className="mt-3 h-1.5"
              />
              <p className="mt-1.5 text-xs text-muted tabular-nums">
                {closestAward.progress.current}/{closestAward.progress.target}
              </p>
            </div>
          )}
          {!closestAward && earned.length === 0 && (
            <p className="text-sm text-muted">{BRAND.tagline}</p>
          )}
        </section>
      </div>
    </div>
  );
}
function PracticeCard({
  to,
  icon: Icon,
  tone,
  title,
  body,
  badge,
}: {
  to: string;
  icon: LucideIcon;
  tone: "accent" | "indigo" | "primary";
  title: string;
  body: string;
  badge?: string;
}) {
  const color = {
    indigo: "bg-indigo-soft text-indigo",
    accent: "bg-accent-soft text-accent",
    primary: "bg-primary-soft text-primary-text",
  }[tone];
  return (
    <Link to={to} className="card card-hover group flex items-center gap-4 p-5">
      <span
        className={classes(
          "relative grid size-12 shrink-0 place-items-center rounded-2xl",
          color,
        )}
        aria-hidden={true}
      >
        <Icon className="size-5.5" />
        {badge && (
          <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-semibold text-white dark:text-[#2a0d0a]">
            {badge}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="line-clamp-2 block text-sm text-muted">{body}</span>
      </span>
      <ArrowRight
        className="size-4.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
        aria-hidden={true}
      />
    </Link>
  );
}
