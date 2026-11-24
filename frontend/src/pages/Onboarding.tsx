import * as React from "react";
import { Fragment } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  HeartHandshake,
  MessagesSquare,
  Star,
  Plane,
  Users,
  Target,
  Briefcase,
  School,
  Sprout,
} from "lucide-react";
import {
  GOALS,
  LANGUAGE_NAMES,
  UI_LANGUAGES,
  NATIVE_LANGUAGES,
} from "../../../shared/constants";
import { BRAND } from "../../../shared/brand";
import { usePageMeta } from "../lib/use-page-meta";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import { ProgressBar } from "../components/ProgressIndicators";
import { ThemeToggle } from "../components/ThemeToggle";
import { Brand } from "../components/Brand";
import { classes } from "../components/PageElements";
import { Button, ChoiceCard } from "../components/FormControls";
const steps = [
  "interface",
  "native",
  "level",
  "goals",
  "variety",
  "daily",
  "explain",
];
const skippable = ["goals", "variety", "daily", "explain"];
const goalIcons = {
  everyday: MessagesSquare,
  travel: Plane,
  education: School,
  employment: Briefcase,
  interviews: Users,
  business: Target,
  academic: GraduationCap,
  exams: Star,
  personal: HeartHandshake,
};
type Experience = "none" | "few" | "some" | "unsure";
export function Onboarding() {
  const translate = useTranslate();
  const navigate = useNavigate();
  const { prefs, update, ready } = usePreferences();
  usePageMeta({
    title: translate("onboarding.title"),
    noindex: true,
  });
  const [stepIndex, setStep] = React.useState(0);
  const [experience, setExperience] = React.useState<Experience | null>(null);
  const [customGoal, setCustomGoal] = React.useState("");
  React.useEffect(() => {
    if (ready && !prefs.onboarding.completed) {
      setStep(Math.min(prefs.onboarding.step, steps.length - 1));
    }
  }, [ready]);
  const goToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, index));
    setStep(clamped);
    update((current) => ({
      onboarding: {
        ...current.onboarding,
        step: clamped,
      },
    }));
  };
  const finish = async (placement = false) => {
    await update((current) => ({
      onboarding: {
        ...current.onboarding,
        completed: true,
        step: steps.length,
      },
    }));
    navigate(placement ? "/placement" : "/home");
  };
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const suggestPlacement = experience === "some" || experience === "unsure";
  const chooseExperience = (choice: Experience) => {
    setExperience(choice);
    update({
      level:
        choice === "none"
          ? "pre-a1"
          : choice === "few"
            ? "a1"
            : choice === "some"
              ? "a2"
              : "pre-a1",
    });
  };
  let content;
  switch (step) {
    case "interface":
      content = (
        <Step title={translate("onboarding.interfaceLanguage")}>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {UI_LANGUAGES.map((language) => (
              <ChoiceCard
                key={language}
                selected={prefs.uiLanguage === language}
                onClick={() =>
                  void update({
                    uiLanguage: language,
                    nativeLanguage:
                      prefs.onboarding.step <= 1
                        ? language
                        : prefs.nativeLanguage,
                    explanationLanguage: language,
                  })
                }
                title={LANGUAGE_NAMES[language].native}
                description={LANGUAGE_NAMES[language].english}
                lang={language}
              />
            ))}
          </div>
        </Step>
      );
      break;
    case "native":
      content = (
        <Step
          title={translate("onboarding.nativeLanguage")}
          help={translate("onboarding.nativeHelp")}
        >
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {NATIVE_LANGUAGES.map((language) => (
              <ChoiceCard
                key={language}
                selected={prefs.nativeLanguage === language}
                onClick={() =>
                  void update({
                    nativeLanguage: language,
                    explanationLanguage: language === "other" ? "en" : language,
                  })
                }
                title={LANGUAGE_NAMES[language].native}
                description={
                  language === "other"
                    ? "Explanations will use simple English"
                    : LANGUAGE_NAMES[language].english
                }
                lang={language === "other" ? undefined : language}
              />
            ))}
          </div>
        </Step>
      );
      break;
    case "level":
      content = (
        <Step title={translate("onboarding.level")}>
          <div role="radiogroup" className="grid gap-2">
            <ChoiceCard
              selected={experience === "none"}
              onClick={() => chooseExperience("none")}
              icon={Sprout}
              title={translate("onboarding.levelNone")}
              description={translate("onboarding.levelNoneHelp")}
            />
            <ChoiceCard
              selected={experience === "few"}
              onClick={() => chooseExperience("few")}
              icon={BookOpen}
              title={translate("onboarding.levelFew")}
              description={translate("onboarding.levelFewHelp")}
            />
            <ChoiceCard
              selected={experience === "some"}
              onClick={() => chooseExperience("some")}
              icon={MessagesSquare}
              title={translate("onboarding.levelSome")}
              description={translate("onboarding.levelSomeHelp")}
            />
            <ChoiceCard
              selected={experience === "unsure"}
              onClick={() => chooseExperience("unsure")}
              icon={Compass}
              title={translate("onboarding.levelUnsure")}
              description={translate("onboarding.levelUnsureHelp")}
            />
          </div>
        </Step>
      );
      break;
    case "goals":
      content = (
        <Step
          title={translate("onboarding.goals")}
          help={translate("onboarding.goalsHelp")}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const selected = prefs.goals.includes(goal);
              return (
                <ChoiceCard
                  key={goal}
                  multi={true}
                  selected={selected}
                  icon={goalIcons[goal]}
                  onClick={() =>
                    void update((current) => ({
                      goals: selected
                        ? current.goals.filter((item) => item !== goal)
                        : [...current.goals, goal],
                    }))
                  }
                  title={translate(`goal.${goal}`)}
                />
              );
            })}
          </div>
        </Step>
      );
      break;
    case "variety":
      content = (
        <Step
          title={translate("onboarding.variety")}
          help={translate("onboarding.varietyHelp")}
        >
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard
              selected={prefs.variety === "british"}
              onClick={() =>
                void update({
                  variety: "british",
                })
              }
              title={translate("onboarding.british")}
              description="colour · flat · holiday · lift"
            />
            <ChoiceCard
              selected={prefs.variety === "american"}
              onClick={() =>
                void update({
                  variety: "american",
                })
              }
              title={translate("onboarding.american")}
              description="color · apartment · vacation · elevator"
            />
          </div>
        </Step>
      );
      break;
    case "daily":
      content = (
        <Step
          title={translate("onboarding.dailyGoal")}
          help={translate("onboarding.dailyGoalHelp")}
        >
          <div
            role="radiogroup"
            className="grid grid-cols-3 gap-2 sm:grid-cols-6"
          >
            {[5, 10, 15, 20, 30].map((minutes) => (
              <button
                key={minutes}
                type="button"
                role="radio"
                aria-checked={prefs.dailyGoalMinutes === minutes}
                onClick={() =>
                  void update({
                    dailyGoalMinutes: minutes,
                  })
                }
                className={classes(
                  "rounded-xl border-2 px-3 py-4 text-center font-semibold",
                  prefs.dailyGoalMinutes === minutes
                    ? "border-primary bg-primary-soft text-primary-text"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                {minutes}
                <span className="block text-xs font-normal text-muted">
                  min
                </span>
              </button>
            ))}
            <label
              className={classes(
                "rounded-xl border-2 px-2 py-2 text-center",
                [5, 10, 15, 20, 30].includes(prefs.dailyGoalMinutes)
                  ? "border-border bg-surface"
                  : "border-primary bg-primary-soft",
              )}
            >
              <span className="block text-xs text-muted">
                {translate("onboarding.custom")}
              </span>
              <input
                type="number"
                min={1}
                max={240}
                inputMode="numeric"
                value={customGoal}
                onChange={(event) => {
                  setCustomGoal(event.target.value);
                  const minutes = Number.parseInt(event.target.value, 10);
                  if (minutes >= 1 && minutes <= 240) {
                    update({
                      dailyGoalMinutes: minutes,
                    });
                  }
                }}
                className="mt-1 w-full rounded-md border border-border bg-surface px-1 py-1 text-center font-semibold"
                aria-label="Custom daily goal in minutes"
              />
            </label>
          </div>
        </Step>
      );
      break;
    case "explain":
      content = (
        <Step title={translate("onboarding.explanationLanguage")}>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {[...new Set([prefs.nativeLanguage, "en"] as const)]
              .filter((language) => language !== "other")
              .map((language) => (
                <ChoiceCard
                  key={language}
                  selected={prefs.explanationLanguage === language}
                  onClick={() =>
                    void update({
                      explanationLanguage: language,
                    })
                  }
                  title={LANGUAGE_NAMES[language].native}
                  description={
                    language === "en"
                      ? "Simple English explanations"
                      : "Recommended for beginners"
                  }
                  lang={language}
                />
              ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            AI explanations use this language. Lesson tips for absolute
            beginners are available in eight languages.
          </p>
        </Step>
      );
  }
  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
          aria-label={`${BRAND.name} home`}
        >
          <Brand small />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {translate("onboarding.title")}
        </h1>
        <p className="mt-1 text-muted">{translate("onboarding.subtitle")}</p>
        <div className="mt-5">
          <p className="mb-1.5 text-sm text-muted">
            {translate("onboarding.step", {
              current: stepIndex + 1,
              total: steps.length,
            })}
          </p>
          <ProgressBar
            value={(stepIndex + 1) / steps.length}
            label={translate("onboarding.step", {
              current: stepIndex + 1,
              total: steps.length,
            })}
          />
        </div>
        <div key={step} className="mt-8 animate-fade-up">
          {content}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => goToStep(stepIndex - 1)}
            disabled={stepIndex === 0}
          >
            {translate("common.back")}
          </Button>
          <div className="flex flex-wrap gap-2">
            {skippable.includes(step) && !isLast && (
              <Button variant="ghost" onClick={() => goToStep(stepIndex + 1)}>
                {translate("common.skip")}
              </Button>
            )}
            {isLast ? (
              <Fragment>
                {suggestPlacement && (
                  <Button variant="secondary" onClick={() => void finish(true)}>
                    {translate("onboarding.takePlacement")}
                  </Button>
                )}
                <Button onClick={() => void finish(false)} iconEnd={ArrowRight}>
                  {translate("onboarding.finish")}
                </Button>
              </Fragment>
            ) : (
              <Button
                onClick={() => goToStep(stepIndex + 1)}
                iconEnd={ArrowRight}
              >
                {translate("common.next")}
              </Button>
            )}
          </div>
        </div>
        <p className="mt-10 text-center text-sm">
          <button
            type="button"
            className="text-muted underline-offset-2 hover:underline"
            onClick={() => void finish(false)}
          >
            {translate("onboarding.skipAll")}
          </button>
        </p>
      </main>
    </div>
  );
}
function Step({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-xl font-semibold">{title}</legend>
      {help && <p className="mt-1 text-muted">{help}</p>}
      <div className="mt-5">{children}</div>
    </fieldset>
  );
}
