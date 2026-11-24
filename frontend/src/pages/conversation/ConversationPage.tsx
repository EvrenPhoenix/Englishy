import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CircleCheck, Sparkles } from "lucide-react";
import {
  LEVEL_LABELS,
  type CorrectionMode,
} from "../../../../shared/constants";
import { getScenario } from "../../../../shared/scenarios";
import { useTranslate } from "../../i18n/provider";
import { usePreferences } from "../../components/PreferencesProvider";
import {
  Badge,
  Button,
  ChoiceCard,
  Notice,
  Segmented,
} from "../../components/ui";
import { TutorMark } from "../../components/ChatMessages";
import { contentIcon } from "../../components/content-icons";
import { usePageMeta } from "../../lib/use-page-meta";
import { useAiStatus } from "../../lib/use-ai-status";
import { NotFound } from "../NotFound";
import { partnerName } from "./helpers";
import { ScrollPage } from "./helpers";
import { RolePlay } from "./RolePlay";

export type Difficulty = "easy" | "standard" | "challenging";

export function ConversationPage() {
  const t = useTranslate();
  const { scenarioId = "" } = useParams();
  const scenario = getScenario(scenarioId);
  usePageMeta({
    title: scenario
      ? `${scenario.title} · Conversation practice`
      : "Conversation",
    description: scenario?.setting,
    path: `/conversation/${scenarioId}`,
    noindex: !scenario,
  });
  const { prefs } = usePreferences();
  const [started, setStarted] = useState<{
    difficulty: Difficulty;
    correction: CorrectionMode;
  } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    ["pre-a1", "a1"].includes(prefs.level) ? "easy" : "standard",
  );
  const [correction, setCorrection] = useState<CorrectionMode>(
    prefs.correctionMode,
  );
  const status = useAiStatus();
  if (!scenario)
    return (
      <ScrollPage>
        <NotFound />
      </ScrollPage>
    );
  const Icon = contentIcon(scenario.icon);
  if (started)
    return (
      <RolePlay
        key={`${started.difficulty}-${started.correction}`}
        scenario={scenario}
        {...started}
        onRestart={() => setStarted(null)}
      />
    );
  const name = partnerName(scenario);
  return (
    <ScrollPage>
      <Link
        to="/conversation"
        className="inline-flex items-center gap-1.5 rounded-full py-1 pe-2 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
        {" All scenarios"}
      </Link>
      <header className="mt-5 flex items-start gap-4">
        <span
          className="bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white"
          aria-hidden
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">
            {scenario.title}
          </h1>
          <p className="mt-1 text-muted">{scenario.setting}</p>
          <Badge tone="primary" className="mt-2">
            {"From "}
            {LEVEL_LABELS[scenario.minLevel].code}
          </Badge>
        </div>
      </header>
      <div className="card mt-6 p-5">
        <div className="flex items-start gap-3">
          <TutorMark className="size-9" />
          <p className="min-w-0">
            <strong>{name ?? "Your partner"}</strong>
            <span className="text-muted">
              {" · "}
              {name
                ? scenario.aiRole.slice(name.length + 1).trim()
                : scenario.aiRole}
            </span>
            <br />
            <span className="text-muted">You are </span>
            {scenario.learnerRole}
            {"."}
          </p>
        </div>
        <h2 className="mt-5 text-sm font-semibold">Goals</h2>
        <ul className="mt-2 space-y-1.5">
          {scenario.objectives.map((goal) => (
            <li key={goal} className="flex gap-2">
              <CircleCheck
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {goal}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <p className="mb-2 font-semibold" id="difficulty">
            Difficulty
          </p>
          <Segmented
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            className="w-full"
            options={[
              { value: "easy", label: "Easy" },
              { value: "standard", label: "Standard" },
              { value: "challenging", label: "Challenging" },
            ]}
          />
        </div>
        <fieldset>
          <legend className="mb-2 font-semibold">Corrections</legend>
          <div
            className="grid gap-2"
            role="radiogroup"
            aria-label="Corrections"
          >
            {(
              [
                [
                  "major",
                  t("settings.correctMajor"),
                  t("settings.correctMajorHelp"),
                ],
                [
                  "immediate",
                  t("settings.correctAll"),
                  t("settings.correctAllHelp"),
                ],
                [
                  "end",
                  t("settings.correctNone"),
                  t("settings.correctNoneHelp"),
                ],
              ] as const
            ).map(([mode, title, description]) => (
              <ChoiceCard
                key={mode}
                selected={correction === mode}
                onClick={() => setCorrection(mode)}
                title={title}
                description={description}
              />
            ))}
          </div>
        </fieldset>
        {status && !status.available && (
          <Notice tone="warning">
            The AI partner is not available right now. Try a lesson in the
            meantime.
          </Notice>
        )}
        <Button
          size="lg"
          className="w-full"
          icon={Sparkles}
          disabled={status?.available === false}
          onClick={() => setStarted({ difficulty, correction })}
        >
          Start conversation
        </Button>
      </div>
    </ScrollPage>
  );
}
