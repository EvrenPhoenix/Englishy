import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Compass, Info } from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { LEVELS, LEVEL_LABELS, type Level } from "../../../shared/constants";
import type { WritingFeedback } from "../../../shared/schemas";
import { placement } from "../data/placement";
import type { PlacementStage } from "../data/types";
import { LogoMark } from "../components/Brand";
import { Badge } from "../components/PageElements";
import { Button } from "../components/FormControls";
import { Notice, SelectField } from "../components/Controls";
import { ProgressBar } from "../components/ProgressIndicators";
import { ExerciseView } from "../components/ExerciseView";
import { usePreferences } from "../components/PreferencesProvider";
import { usePageMeta } from "../lib/use-page-meta";
import { useActiveTime } from "../lib/use-active-time";
import { useAiProfile } from "../lib/use-ai-profile";
import { logActivity } from "../lib/activity";
import { speechSupported } from "../lib/speech";
import { aiErrorMessage, postJson } from "../lib/ai";

interface PlacementAnswer {
  stage: number;
  questionId: string;
  skill: string;
  correct: boolean;
}

const skillNames: Record<string, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  construction: "Sentence building",
  listening: "Listening",
};
const PASS_RATE = 0.6;

function stageScore(answers: PlacementAnswer[], stage: number) {
  const rows = answers.filter((answer) => answer.stage === stage);
  return {
    correct: rows.filter((answer) => answer.correct).length,
    total: rows.length,
  };
}
/** A stage is passed with 60% of its questions answered correctly. */
function passedStage(
  answers: PlacementAnswer[],
  stage: number,
  stages: PlacementStage[],
) {
  const { correct, total } = stageScore(answers, stage);
  const asked = Math.min(total, stages[stage].questions.length);
  return asked > 0 && correct / asked >= PASS_RATE;
}
function nextStage(
  answers: PlacementAnswer[],
  stage: number,
  stages: PlacementStage[],
) {
  return passedStage(answers, stage, stages) && stage + 1 < stages.length
    ? stage + 1
    : null;
}
/** The highest level whose stage, and every stage before it, was passed. */
function estimatedLevel(
  answers: PlacementAnswer[],
  reached: number,
  stages: PlacementStage[],
) {
  let level: Level = "pre-a1";
  for (let i = 0; i < reached && passedStage(answers, i, stages); i++)
    level = stages[i].level;
  return level;
}
function skillBreakdown(answers: PlacementAnswer[]) {
  const totals = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const entry = totals.get(answer.skill) ?? { correct: 0, total: 0 };
    entry.total++;
    if (answer.correct) entry.correct++;
    totals.set(answer.skill, entry);
  }
  return [...totals.entries()].map(([skill, entry]) => ({ skill, ...entry }));
}

export function PlacementPage() {
  usePageMeta({ title: "Placement check", noindex: true });
  const navigate = useNavigate();
  const { update } = usePreferences();
  const activeTime = useActiveTime();
  const canListen = speechSupported();
  // Listening questions are dropped when this device cannot play audio.
  const stages = useMemo(
    () =>
      placement.map((stage) => ({
        ...stage,
        questions: stage.questions.filter(
          (question) => canListen || question.skill !== "listening",
        ),
      })),
    [canListen],
  );
  const [view, setView] = useState<"intro" | "test" | "result">("intro");
  const [stage, setStage] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [reached, setReached] = useState(0);
  const [chosen, setChosen] = useState<Level | null>(null);
  const logged = useRef(false);
  const question = stages[stage]?.questions[index];
  const totalQuestions = stages.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = answers.length;

  const showResult = (stagesReached: number, final: PlacementAnswer[]) => {
    setReached(stagesReached);
    setView("result");
    if (!logged.current) {
      logged.current = true;
      void logActivity({
        type: "placement",
        title: "Placement check",
        durationSec: Math.min(activeTime.take(), 3600),
        xp: 0,
        correct: final.filter((answer) => answer.correct).length,
        total: final.length,
      });
    }
  };
  const record = (outcome: { correct: boolean; deviceSkip: boolean }) => {
    if (!question || outcome.deviceSkip) return;
    setAnswers((current) => [
      ...current.filter((answer) => answer.questionId !== question.id),
      {
        stage,
        questionId: question.id,
        skill: question.skill,
        correct: outcome.correct,
      },
    ]);
  };
  const advance = (current = answers) => {
    if (index + 1 < stages[stage].questions.length) return setIndex(index + 1);
    const next = nextStage(current, stage, stages);
    if (next === null) return showResult(stage + 1, current);
    setStage(next);
    setIndex(0);
  };
  const suggested = estimatedLevel(answers, reached, stages);
  const level = chosen ?? suggested;
  const skills = skillBreakdown(answers);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
          aria-label={`${BRAND.name} home`}
        >
          <LogoMark className="size-7" /> {BRAND.name}
        </Link>
        {view === "test" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => showResult(stage, answers)}
          >
            Stop here and see my result
          </Button>
        )}
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 pb-16">
        {view === "intro" && (
          <div className="card p-6 sm:p-8">
            <Compass className="size-10 text-primary" aria-hidden />
            <h1 className="mt-4 text-2xl font-semibold">Placement check</h1>
            <p className="mt-2 text-muted">
              {
                "Short questions that get harder step by step: vocabulary, grammar, reading, sentence building"
              }
              {canListen ? " and listening" : ""}
              {
                ". It stops automatically when the questions become too difficult, so you never have to struggle for long. It takes 3 to 10 minutes."
              }
            </p>
            <div className="mt-4">
              <Notice tone="info" icon={Info}>
                This is an informal learning recommendation, not an official or
                accredited language qualification. You can change your level at
                any time.
              </Notice>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                size="lg"
                iconEnd={ArrowRight}
                onClick={() => setView("test")}
              >
                Start
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate("/home")}
              >
                Skip
              </Button>
            </div>
          </div>
        )}
        {view === "test" && question && (
          <section aria-label="Placement question">
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm text-muted">
                <span>
                  {"Stage "}
                  {stage + 1}
                  {" · "}
                  <Badge>{LEVEL_LABELS[stages[stage].level].code}</Badge>
                </span>
                <span>
                  {answeredCount}
                  {" answered"}
                </span>
              </div>
              <ProgressBar
                value={answeredCount / totalQuestions}
                label={`${answeredCount} of up to ${totalQuestions} questions answered`}
              />
            </div>
            <div className="card p-5 sm:p-7">
              <ExerciseView
                key={question.id}
                exercise={question}
                isLast={false}
                onAnswered={record}
                onContinue={() => advance()}
                onSkip={() => {
                  const next = [
                    ...answers.filter(
                      (answer) => answer.questionId !== question.id,
                    ),
                    {
                      stage,
                      questionId: question.id,
                      skill: question.skill,
                      correct: false,
                    },
                  ];
                  setAnswers(next);
                  advance(next);
                }}
              />
            </div>
            <p className="mt-3 text-center text-sm text-muted">
              Not sure? Skipping is fine. It simply counts as not answered.
            </p>
          </section>
        )}
        {view === "result" && (
          <div className="space-y-4">
            <div className="card p-6 text-center sm:p-8">
              <p className="text-sm text-muted">Suggested starting level</p>
              <p className="mt-2 text-4xl font-semibold text-primary-text">
                {LEVEL_LABELS[suggested].code}
              </p>
              <p className="text-lg">{LEVEL_LABELS[suggested].name}</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                {"Based on "}
                {answers.length}
                {
                  " answers. This is an informal estimate to help you choose where to start, not a certificate."
                }
              </p>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold">Skills</h2>
              <ul className="mt-3 space-y-2">
                {skills.map((row) => (
                  <li key={row.skill}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{skillNames[row.skill]}</span>
                      <span className="text-muted tabular-nums">
                        {row.correct}
                        {"/"}
                        {row.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={row.correct / row.total}
                      label={`${skillNames[row.skill]}: ${row.correct} of ${row.total} correct`}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                {(() => {
                  const weak = skills
                    .filter((row) => row.correct / row.total < PASS_RATE)
                    .map((row) => skillNames[row.skill].toLowerCase());
                  return weak.length
                    ? `Areas to work on: ${weak.join(", ")}.`
                    : "Your skills look balanced across the questions you answered.";
                })()}
              </p>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold">Recommended pathway</h2>
              <p className="mt-1 text-sm text-muted">
                {suggested === "pre-a1"
                  ? "Start with the Pre-A1 course: letters, sounds and first phrases."
                  : suggested === "a1"
                    ? "Start with A1 Unit 4. You can always review Pre-A1 lessons."
                    : "The structured course currently covers Pre-A1 and A1, so use A1 lessons as quick review and focus on conversation practice, writing feedback and the grammar library at your level."}
              </p>
              <SelectField
                label="Your level (you can change it)"
                value={level}
                onChange={(value) => setChosen(value)}
                options={LEVELS.map((value) => ({
                  value,
                  label: `${LEVEL_LABELS[value].code} · ${LEVEL_LABELS[value].name}${value === suggested ? " (suggested)" : ""}`,
                }))}
              />
              <Button
                className="mt-2"
                iconEnd={ArrowRight}
                onClick={async () => {
                  await update((prefs) => ({
                    level,
                    onboarding: {
                      ...prefs.onboarding,
                      placementTaken: true,
                      completed: true,
                    },
                  }));
                  navigate(LEVELS.indexOf(level) <= 1 ? "/learn" : "/home");
                }}
              >
                {"Use "}
                {LEVEL_LABELS[level].code}
                {" and continue"}
              </Button>
            </div>
            <WritingSample />
          </div>
        )}
      </main>
    </div>
  );
}

/** Optional AI feedback on a short writing sample. It never changes the level. */
function WritingSample() {
  const profile = useAiProfile();
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const serious = feedback?.issues.filter((issue) => !issue.optional) ?? [];
  return (
    <div className="card p-5">
      <h2 className="font-semibold">Optional: writing sample</h2>
      <p className="mt-1 text-sm text-muted">
        Write 3–5 sentences about yourself and your plans. AI feedback shows
        strengths and mistakes; it does not change your level.
      </p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        lang="en"
        className="mt-3 w-full rounded-xl border border-border-strong bg-surface p-3"
        aria-label="Writing sample"
      />
      <Button
        className="mt-2"
        variant="secondary"
        disabled={checking || text.trim().split(/\s+/).length < 5}
        onClick={async () => {
          setChecking(true);
          setError(null);
          try {
            setFeedback(
              await postJson<WritingFeedback>("/api/ai/writing", {
                profile,
                mode: "exam",
                text,
                includeImproved: false,
                prompt: "Write about yourself and your plans.",
              }),
            );
          } catch (err) {
            setError(aiErrorMessage(err));
          } finally {
            setChecking(false);
          }
        }}
      >
        {checking ? "Checking…" : "Get feedback"}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {feedback && (
        <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
          <p>{feedback.summary}</p>
          {feedback.strengths.length > 0 && (
            <p className="mt-2 text-success">
              {"Strengths: "}
              {feedback.strengths.join(" · ")}
            </p>
          )}
          {serious.length > 0 && (
            <ul className="mt-2 space-y-1">
              {serious.slice(0, 5).map((issue, i) => (
                <li key={i}>
                  {issue.original}
                  {" → "}
                  <strong>{issue.suggestion}</strong>{" "}
                  <span className="text-muted">
                    {"("}
                    {issue.explanation}
                    {")"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
