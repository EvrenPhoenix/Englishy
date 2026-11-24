import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  CircleCheck,
  CircleX,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { WritingFeedback } from "../../../shared/schemas";
import type { Exercise } from "../data/types";
import { useTranslate } from "../i18n/provider";
import { aiErrorMessage, postJson, streamText } from "../lib/ai";
import { useAiProfile } from "../lib/use-ai-profile";
import { speechSupported } from "../lib/speech";
import {
  checkOrder,
  checkText,
  matchSpokenWords,
  seedFromId,
  seededShuffle,
  type CheckResult,
} from "../lib/validate";
import { Button, classes } from "./ui";
import { usePreferences } from "./PreferencesProvider";
import { ListenButton, RecorderControls, useRecorder } from "./SpeechControls";

const instructions: Record<Exercise["type"], string> = {
  mc: "Choose the correct answer.",
  blank: "Fill in the gap.",
  order: "Put the words in the correct order.",
  match: "Match the pairs.",
  translate: "Write it in English.",
  spot: "Find the word that is wrong.",
  correct: "Correct the sentence.",
  recall: "Write the word.",
  listen: "Listen and choose.",
  dictation: "Listen and write what you hear.",
  reading: "Read and answer.",
  write: "Write your answer.",
  speak: "Listen, then say it aloud.",
};

/** The model answer shown after a mistake and stored with results. */
export function expectedAnswer(exercise: Exercise): string {
  switch (exercise.type) {
    case "mc":
    case "listen":
    case "reading":
      return exercise.options[exercise.answer];
    case "blank":
    case "recall":
    case "translate":
    case "dictation":
    case "correct":
      return exercise.answers[0];
    case "order":
      return exercise.words.join(" ").replace(/ ([,.?!])/g, "$1");
    case "spot":
      return exercise.correction;
    case "match":
      return exercise.pairs.map((pair) => `${pair[0]} → ${pair[1]}`).join(", ");
    case "write":
      return exercise.sample ?? "";
    case "speak":
      return exercise.text;
  }
}

export interface ExerciseOutcome {
  correct: boolean;
  given?: string;
  expected: string;
  /** The device could not play or record audio, so the answer is unscored. */
  deviceSkip: boolean;
}
export interface SavedAnswer {
  correct: boolean;
  given?: string;
  deviceSkip?: boolean;
}

type Phase = "answering" | "correct" | "incorrect";
type Extra = { deviceSkip?: boolean };

/**
 * One exercise with checking, hints, feedback and retry. The first answer is reported
 * through `onAnswered`; retries are practice only.
 */
export function ExerciseView({
  exercise,
  savedAnswer,
  onAnswered,
  onContinue,
  onSkip,
  isLast,
}: {
  exercise: Exercise;
  savedAnswer?: SavedAnswer;
  onAnswered: (outcome: ExerciseOutcome) => void;
  onContinue: () => void;
  onSkip: (audioUnavailable: boolean) => void;
  isLast: boolean;
}) {
  const t = useTranslate();
  const [phase, setPhase] = useState<Phase>(
    savedAnswer ? (savedAnswer.correct ? "correct" : "incorrect") : "answering",
  );
  const [almost, setAlmost] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const reported = useRef(Boolean(savedAnswer));
  const audioFallback = useRef(false);
  const [unscored, setUnscored] = useState(Boolean(savedAnswer?.deviceSkip));
  const continueButton = useRef<HTMLButtonElement>(null);

  const finish = (correct: boolean, given?: string, extra?: Extra) => {
    const deviceSkip = audioFallback.current || Boolean(extra?.deviceSkip);
    setUnscored(deviceSkip);
    setPhase(correct ? "correct" : "incorrect");
    setAlmost(false);
    if (!reported.current) {
      reported.current = true;
      onAnswered({
        correct,
        given,
        expected: expectedAnswer(exercise),
        ...extra,
        deviceSkip,
      });
    }
  };
  useEffect(() => {
    if (phase !== "answering") continueButton.current?.focus();
  }, [phase]);
  const retry = () => {
    setPhase("answering");
    setRetrying(true);
    setAttempt((n) => n + 1);
  };
  const prompt =
    "prompt" in exercise && exercise.prompt ? exercise.prompt : null;
  const answered = phase !== "answering";

  return (
    <div className="animate-fade-up">
      <p className="mb-1 text-sm font-medium text-muted">
        {instructions[exercise.type]}
      </p>
      {retrying && phase === "answering" && (
        <p className="mb-2 text-xs text-muted">
          Practice attempt: your first answer has already been recorded.
        </p>
      )}
      <div key={attempt}>
        <Answer
          exercise={exercise}
          prompt={prompt}
          answered={answered}
          onCheck={(result, given) =>
            result === "almost"
              ? setAlmost(true)
              : finish(result === "correct", given)
          }
          onFinish={finish}
          onAudioUnavailable={() => {
            audioFallback.current = true;
          }}
          savedAnswer={attempt === 0 ? savedAnswer : undefined}
          almost={almost}
          clearAlmost={() => setAlmost(false)}
        />
      </div>
      {exercise.hint && !answered && (
        <div className="mt-4">
          {hintShown ? (
            <p className="inline-flex items-start gap-2 rounded-2xl bg-accent-soft px-4 py-2.5 text-sm">
              <Lightbulb
                className="mt-0.5 size-4 shrink-0 text-accent"
                aria-hidden
              />
              {exercise.hint}
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={Lightbulb}
              onClick={() => setHintShown(true)}
            >
              {t("lesson.hint")}
            </Button>
          )}
        </div>
      )}
      {almost && !answered && (
        <p
          className="animate-pop mt-4 rounded-2xl bg-warning-soft px-4 py-2.5 text-sm font-medium"
          role="status"
        >
          {t("lesson.almost")}
        </p>
      )}
      {answered && (
        <Feedback
          correct={phase === "correct"}
          unscored={unscored}
          exercise={exercise}
        >
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              ref={continueButton}
              size="lg"
              className="flex-1 sm:flex-none sm:min-w-40"
              onClick={onContinue}
              iconEnd={Check}
            >
              {t(isLast ? "common.done" : "common.continue")}
            </Button>
            {phase === "incorrect" && (
              <Button
                variant="secondary"
                size="lg"
                icon={RotateCcw}
                onClick={retry}
              >
                {t("lesson.tryAgain")}
              </Button>
            )}
          </div>
        </Feedback>
      )}
      {!answered && (
        <div className="mt-8 flex justify-center border-t border-border pt-4 sm:justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip(audioFallback.current)}
          >
            {t("lesson.skipQuestion")}
          </Button>
        </div>
      )}
    </div>
  );
}

function Feedback({
  correct,
  exercise,
  children,
  unscored,
}: {
  correct: boolean;
  exercise: Exercise;
  children: ReactNode;
  unscored: boolean;
}) {
  const t = useTranslate();
  const expected = expectedAnswer(exercise);
  const profile = useAiProfile();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const showAnswer =
    !correct && exercise.type !== "write" && exercise.type !== "speak";
  return (
    <div
      className={classes(
        "animate-slide-up sticky bottom-3 z-20 mt-6 rounded-3xl p-5 shadow-raised ring-1",
        correct
          ? "bg-success-soft ring-success/25"
          : "bg-danger-soft ring-danger/20",
      )}
      role="status"
      aria-live="polite"
    >
      <p
        className={classes(
          "flex items-center gap-2 text-lg font-semibold",
          correct ? "text-success" : "text-danger",
        )}
      >
        {correct ? (
          <CircleCheck className="size-6" aria-hidden />
        ) : (
          <CircleX className="size-6" aria-hidden />
        )}
        {t(correct ? "lesson.correct" : "lesson.incorrect")}
      </p>
      {unscored && (
        <p className="mt-1 text-sm text-muted">
          Practice only. This question is left out of your score.
        </p>
      )}
      {showAnswer && (
        <p className="mt-1">{t("lesson.answer", { answer: expected })}</p>
      )}
      {exercise.explanation && (
        <p className="mt-1 text-sm text-text/85">{exercise.explanation}</p>
      )}
      {showAnswer && (
        <div className="mt-2">
          {explanation ? (
            <p className="rounded-2xl bg-surface/70 p-3 text-sm whitespace-pre-wrap">
              {explanation}
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={Sparkles}
              onClick={async () => {
                setAsking(true);
                try {
                  let text = "";
                  await streamText(
                    "/api/ai/explain",
                    {
                      profile,
                      topic: "answer",
                      subject:
                        ("prompt" in exercise && exercise.prompt) ||
                        ("sentence" in exercise && exercise.sentence) ||
                        expected,
                      detail: `Expected answer: ${expected}`,
                    },
                    (_chunk, sofar) => {
                      text = sofar;
                      setExplanation(sofar);
                    },
                  );
                  if (!text)
                    setExplanation(
                      "No explanation was returned. Please try again.",
                    );
                } catch (error) {
                  setExplanation(aiErrorMessage(error));
                } finally {
                  setAsking(false);
                }
              }}
              disabled={asking}
            >
              {asking ? "Asking the tutor…" : t("lesson.explainAi")}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface AnswerProps {
  exercise: Exercise;
  prompt: string | null;
  answered: boolean;
  onCheck: (result: CheckResult, given: string) => void;
  onFinish: (correct: boolean, given?: string, extra?: Extra) => void;
  onAudioUnavailable: () => void;
  savedAnswer?: SavedAnswer;
  almost: boolean;
  clearAlmost: () => void;
}

function Answer(props: AnswerProps) {
  const { exercise } = props;
  switch (exercise.type) {
    case "mc":
      return (
        <Choice
          {...props}
          question={exercise.prompt}
          options={exercise.options}
          answer={exercise.answer}
        />
      );
    case "listen":
      return (
        <Choice
          {...props}
          question={exercise.prompt}
          options={exercise.options}
          answer={exercise.answer}
          audio={exercise.audio}
        />
      );
    case "reading":
      return (
        <Choice
          {...props}
          question={exercise.prompt}
          options={exercise.options}
          answer={exercise.answer}
          passage={exercise.passage}
          title={exercise.title}
        />
      );
    case "blank":
      return (
        <TypedAnswer
          {...props}
          question={exercise.prompt}
          accepted={exercise.answers}
          strict={exercise.strictSpelling}
        />
      );
    case "recall":
      return (
        <TypedAnswer
          {...props}
          question={exercise.clue}
          accepted={exercise.answers}
        />
      );
    case "translate":
      return <Translate {...props} />;
    case "dictation":
      return (
        <TypedAnswer
          {...props}
          question=""
          accepted={exercise.answers}
          audio={exercise.audio}
        />
      );
    case "correct":
      return (
        <TypedAnswer
          {...props}
          question={exercise.sentence}
          accepted={exercise.answers}
          prefill={exercise.sentence}
          caseSensitive={exercise.caseSensitive}
        />
      );
    case "order":
      return <WordOrder {...props} />;
    case "match":
      return <MatchPairs {...props} />;
    case "spot":
      return <SpotMistake {...props} />;
    case "write":
      return <FreeWriting {...props} />;
    case "speak":
      return <SpeakAloud {...props} />;
  }
}

function Question({ children }: { children: ReactNode }) {
  return (
    <p className="text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl">
      {children}
    </p>
  );
}

function Choice({
  question,
  options,
  answer,
  audio,
  passage,
  title,
  answered,
  onFinish,
  onAudioUnavailable,
  savedAnswer,
}: AnswerProps & {
  question: string;
  options: string[];
  answer: number;
  audio?: string;
  passage?: string;
  title?: string;
}) {
  const t = useTranslate();
  const [selected, setSelected] = useState<number | null>(() => {
    const index =
      savedAnswer?.given === undefined
        ? -1
        : options.indexOf(savedAnswer.given);
    return index < 0 ? null : index;
  });
  const submit = (choice = selected) =>
    choice !== null && onFinish(choice === answer, options[choice]);
  // Number keys pick an option and Enter checks, except while typing elsewhere.
  useEffect(() => {
    if (answered) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = Number(event.key);
      if (n >= 1 && n <= options.length) setSelected(n - 1);
      if (event.key === "Enter" && selected !== null) {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div>
      {passage && (
        <article className="mb-5 rounded-2xl bg-surface-2 p-5 leading-relaxed">
          {title && <h3 className="mb-2 font-semibold">{title}</h3>}
          {passage.split("\n").map((line, i) => (
            <p key={i} className={i ? "mt-2" : ""}>
              {line}
            </p>
          ))}
          {speechSupported() && (
            <div className="mt-3">
              <ListenButton
                text={passage}
                label="Listen to the text"
                size="sm"
                showSpeed
                revealFallback={false}
              />
            </div>
          )}
        </article>
      )}
      {audio && (
        <div className="mb-4">
          <ListenButton
            text={audio}
            label={t("common.listen")}
            size="lg"
            showSpeed
            onUnavailable={onAudioUnavailable}
          />
        </div>
      )}
      <Question>{question}</Question>
      <div
        role="radiogroup"
        aria-label={question}
        className="mt-5 grid gap-2.5 sm:grid-cols-2"
      >
        {options.map((option, i) => {
          const isAnswer = answered && i === answer;
          const isWrongPick = answered && selected === i && i !== answer;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected === i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={classes(
                "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-start text-[1.02rem] transition-colors",
                isAnswer
                  ? "border-success bg-success-soft"
                  : isWrongPick
                    ? "border-danger bg-danger-soft"
                    : selected === i
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:border-border-strong",
                answered && !isAnswer && !isWrongPick && "opacity-60",
              )}
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-lg border border-border-strong text-xs text-muted"
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="flex-1">{option}</span>
              {isAnswer && (
                <CircleCheck
                  className="size-5 text-success"
                  aria-label="Correct answer"
                />
              )}
              {isWrongPick && (
                <CircleX
                  className="size-5 text-danger"
                  aria-label="Your answer"
                />
              )}
            </button>
          );
        })}
      </div>
      {!answered && (
        <Button
          size="lg"
          className="mt-6 w-full sm:w-auto sm:min-w-40"
          onClick={() => submit()}
          disabled={selected === null}
        >
          {t("lesson.check")}
        </Button>
      )}
    </div>
  );
}

function TypedAnswer({
  question,
  accepted,
  strict,
  caseSensitive,
  prefill,
  audio,
  answered,
  onCheck,
  almost,
  clearAlmost,
  onAudioUnavailable,
  savedAnswer,
}: AnswerProps & {
  question: string;
  accepted: string[];
  strict?: boolean;
  caseSensitive?: boolean;
  prefill?: string;
  audio?: string;
}) {
  const t = useTranslate();
  const [value, setValue] = useState(savedAnswer?.given ?? prefill ?? "");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const parts = question.split("___");
  const check = () =>
    value.trim() &&
    onCheck(
      checkText(value, accepted, { strictSpelling: strict, caseSensitive }),
      value.trim(),
    );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!answered) check();
      }}
    >
      {audio && (
        <div className="mb-4">
          <ListenButton
            text={audio}
            label={t("common.listen")}
            size="lg"
            showSpeed
            onUnavailable={onAudioUnavailable}
          />
        </div>
      )}
      {question && (
        <Question>
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span
                className="mx-1 inline-block min-w-16 border-b-2 border-primary text-center text-primary-text"
                aria-label="gap"
              >
                {answered ? value : " "}
              </span>
              {parts.slice(1).join("___")}
            </>
          ) : (
            question
          )}
        </Question>
      )}
      <label className="mt-5 block">
        <span className="sr-only">{t("lesson.typeAnswer")}</span>
        <input
          ref={input}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (almost) clearAlmost();
          }}
          disabled={answered}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          lang="en"
          placeholder={t("lesson.typeAnswer")}
          className={classes(
            "h-14 w-full rounded-2xl border-2 bg-surface px-5 text-lg",
            almost
              ? "border-warning"
              : "border-border-strong focus:border-primary",
          )}
        />
      </label>
      {!answered && (
        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full sm:w-auto sm:min-w-40"
          disabled={!value.trim()}
        >
          {t("lesson.check")}
        </Button>
      )}
    </form>
  );
}

function Translate(props: AnswerProps) {
  const { prefs } = usePreferences();
  const exercise = props.exercise as Extract<Exercise, { type: "translate" }>;
  const language = prefs.nativeLanguage;
  const source =
    language !== "en" && language !== "other"
      ? exercise.source[language]
      : undefined;
  return (
    <div>
      {source ? (
        <p
          className="mb-1 rounded-2xl bg-surface-2 px-5 py-4 text-xl"
          lang={language}
          dir={language === "ar" ? "rtl" : undefined}
        >
          {source}
        </p>
      ) : (
        <p className="mb-1 rounded-2xl bg-surface-2 px-5 py-4 text-lg">
          {exercise.fallback}
        </p>
      )}
      <TypedAnswer {...props} question="" accepted={exercise.answers} />
    </div>
  );
}

function WordOrder({ exercise, answered, onFinish }: AnswerProps) {
  const t = useTranslate();
  const order = exercise as Extract<Exercise, { type: "order" }>;
  const bank = useMemo(
    () =>
      seededShuffle(
        order.words.map((w, i) => ({ w, i })),
        seedFromId(order.id),
      ),
    [order],
  );
  const [picked, setPicked] = useState<{ w: string; i: number }[]>([]);
  const used = new Set(picked.map((tile) => tile.i));
  return (
    <div>
      <p className="text-sm text-muted">{t("lesson.tapWords")}</p>
      <div
        className="mt-3 flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-border-strong p-3"
        aria-label="Your sentence"
        aria-live="polite"
      >
        {picked.length === 0 && <span className="text-muted">…</span>}
        {picked.map((tile, n) => (
          <button
            key={`${tile.i}-${n}`}
            type="button"
            disabled={answered}
            onClick={() => setPicked(picked.filter((p) => p.i !== tile.i))}
            className="animate-pop rounded-xl bg-primary-soft px-3.5 py-2 text-lg font-medium text-primary-text"
            aria-label={`Remove ${tile.w}`}
          >
            {tile.w}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Words">
        {bank.map((tile) => (
          <button
            key={tile.i}
            type="button"
            disabled={answered || used.has(tile.i)}
            onClick={() => setPicked([...picked, tile])}
            className={classes(
              "rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-lg shadow-card transition-opacity",
              used.has(tile.i) && "opacity-30",
            )}
          >
            {tile.w}
          </button>
        ))}
      </div>
      {!answered && (
        <div className="mt-5 flex gap-2">
          <Button
            size="lg"
            className="flex-1 sm:flex-none sm:min-w-40"
            onClick={() =>
              onFinish(
                checkOrder(
                  picked.map((tile) => tile.w),
                  order.words,
                  order.alternatives,
                ),
                picked.map((tile) => tile.w).join(" "),
              )
            }
            disabled={picked.length !== order.words.length}
          >
            {t("lesson.check")}
          </Button>
          {picked.length > 0 && (
            <Button variant="ghost" size="lg" onClick={() => setPicked([])}>
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function MatchPairs({ exercise, answered, onFinish }: AnswerProps) {
  const match = exercise as Extract<Exercise, { type: "match" }>;
  const left = match.pairs.map((pair) => pair[0]);
  const right = useMemo(
    () =>
      seededShuffle(
        match.pairs.map((pair) => pair[1]),
        seedFromId(match.id),
      ),
    [match],
  );
  const [active, setActive] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const choose = (value: string) => {
    if (!active) return;
    if (match.pairs.find((pair) => pair[0] === active)?.[1] === value) {
      const next = { ...matched, [active]: value };
      setMatched(next);
      setActive(null);
      if (Object.keys(next).length === match.pairs.length)
        onFinish(
          mistakes === 0,
          mistakes ? `${mistakes} mistake(s)` : undefined,
        );
    } else {
      setMistakes((n) => n + 1);
      setFlash(value);
      setTimeout(() => setFlash(null), 600);
    }
  };
  const done = new Set(Object.values(matched));
  return (
    <div>
      {match.prompt && <Question>{match.prompt}</Question>}
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {active
          ? `Selected "${active}". Now choose its match.`
          : "Choose an item on the left, then its match on the right."}
        {mistakes > 0 && ` · Mistakes: ${mistakes}`}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((item) => (
            <button
              key={item}
              type="button"
              disabled={answered || !!matched[item]}
              aria-pressed={active === item}
              onClick={() => setActive(item)}
              className={classes(
                "flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-start",
                matched[item]
                  ? "border-success/40 bg-success-soft"
                  : active === item
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:border-border-strong",
              )}
            >
              <span>{item}</span>
              {matched[item] && (
                <Check className="size-4 text-success" aria-label="matched" />
              )}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((item) => (
            <button
              key={item}
              type="button"
              disabled={answered || done.has(item)}
              onClick={() => choose(item)}
              className={classes(
                "flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-start transition-colors",
                done.has(item)
                  ? "border-success/40 bg-success-soft"
                  : flash === item
                    ? "border-danger bg-danger-soft"
                    : "border-border bg-surface hover:border-border-strong",
              )}
            >
              <span>{item}</span>
              {done.has(item) && (
                <Check className="size-4 text-success" aria-label="matched" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpotMistake({ exercise, answered, onFinish }: AnswerProps) {
  const t = useTranslate();
  const spot = exercise as Extract<Exercise, { type: "spot" }>;
  const words = spot.sentence.split(" ");
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div>
      {spot.prompt && <Question>{spot.prompt}</Question>}
      <div
        className="mt-2 flex flex-wrap gap-2 text-xl"
        role="radiogroup"
        aria-label="Words in the sentence"
      >
        {words.map((word, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected === i}
            disabled={answered}
            onClick={() => setSelected(i)}
            className={classes(
              "rounded-xl border-2 px-3 py-1.5",
              answered && i === spot.wrongIndex
                ? "border-danger bg-danger-soft line-through decoration-2"
                : selected === i
                  ? "border-primary bg-primary-soft"
                  : "border-transparent bg-surface-2 hover:border-border-strong",
            )}
          >
            {word}
          </button>
        ))}
      </div>
      {answered && (
        <p className="mt-3">
          {"Correction: "}
          <strong className="text-success">{spot.correction}</strong>
        </p>
      )}
      {!answered && (
        <Button
          size="lg"
          className="mt-6 w-full sm:w-auto sm:min-w-40"
          disabled={selected === null}
          onClick={() =>
            selected !== null &&
            onFinish(selected === spot.wrongIndex, words[selected])
          }
        >
          {t("lesson.check")}
        </Button>
      )}
    </div>
  );
}

function FreeWriting({ exercise, answered, onFinish }: AnswerProps) {
  const task = exercise as Extract<Exercise, { type: "write" }>;
  const profile = useAiProfile();
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div>
      <Question>{task.prompt}</Question>
      <label className="mt-4 block">
        <span className="sr-only">Your answer</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={answered}
          rows={5}
          lang="en"
          className="w-full rounded-2xl border-2 border-border-strong bg-surface p-4 text-lg focus:border-primary"
          maxLength={2000}
        />
      </label>
      <p className="mt-1 text-sm text-muted" aria-live="polite">
        {words}
        {" / "}
        {task.minWords}
        {" words"}
      </p>
      {!answered && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={words < task.minWords}
            onClick={() => onFinish(true, text.slice(0, 400))}
          >
            Submit
          </Button>
          <Button
            variant="secondary"
            icon={Sparkles}
            disabled={words < 3 || checking}
            onClick={async () => {
              setChecking(true);
              setError(null);
              try {
                setFeedback(
                  await postJson<WritingFeedback>("/api/ai/writing", {
                    profile,
                    mode: "grammar",
                    text,
                    includeImproved: false,
                    prompt: task.prompt,
                  }),
                );
              } catch (err) {
                setError(aiErrorMessage(err));
              } finally {
                setChecking(false);
              }
            }}
          >
            {checking ? "Checking…" : "Get AI feedback (optional)"}
          </Button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {feedback && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm">
          <p className="font-medium">{feedback.summary}</p>
          {feedback.issues.filter((issue) => !issue.optional).length > 0 && (
            <>
              <p className="mt-2 text-muted">Corrected:</p>
              <p className="mt-0.5">{feedback.corrected}</p>
            </>
          )}
          <ul className="mt-2 space-y-1">
            {feedback.issues.slice(0, 6).map((issue, i) => (
              <li key={i}>
                <span className="line-through decoration-danger">
                  {issue.original}
                </span>
                {" → "}
                <strong>{issue.suggestion}</strong>{" "}
                <span className="text-muted">
                  {"("}
                  {issue.optional ? "optional" : issue.category}
                  {") "}
                  {issue.explanation}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            AI feedback can be wrong. Use it as a helpful second opinion.
          </p>
        </div>
      )}
      {answered && task.sample && (
        <p className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm">
          <span className="font-medium">Example answer: </span>
          {task.sample}
        </p>
      )}
    </div>
  );
}

function SpeakAloud({ exercise, answered, onFinish }: AnswerProps) {
  const task = exercise as Extract<Exercise, { type: "speak" }>;
  const recorder = useRecorder();
  const words = recorder.transcript
    ? matchSpokenWords(task.text, recorder.transcript)
    : [];
  const heard = words.filter((word) => word.matched).length;
  const ratio = words.length ? heard / words.length : 0;
  // Open-ended prompts ("My name is …") cannot be word-checked.
  const openEnded = /…|\.\.\./.test(task.text);
  const good = openEnded || ratio >= 0.7;
  return (
    <div>
      {task.prompt && <p className="mb-2 text-lg">{task.prompt}</p>}
      <p className="text-2xl font-medium">{task.text}</p>
      <div className="mt-4">
        <ListenButton
          text={task.text.replace(/…/g, "")}
          label="Listen first"
          showSpeed
        />
      </div>
      {!answered && (
        <div className="mt-5 space-y-3">
          {recorder.supported ? (
            <>
              <RecorderControls recorder={recorder} />
              {recorder.transcript && (
                <div className="rounded-2xl bg-surface-2 p-4">
                  <p className="text-sm text-muted">We heard:</p>
                  <p className="mt-1 text-lg">
                    {"“"}
                    {recorder.transcript}
                    {"”"}
                  </p>
                  {!openEnded && (
                    <p
                      className="mt-2 flex flex-wrap gap-1.5 text-sm"
                      aria-label="Word check"
                    >
                      {words.map((word, i) => (
                        <span
                          key={i}
                          className={classes(
                            "rounded px-1.5 py-0.5",
                            word.matched
                              ? "bg-success-soft text-success"
                              : "bg-warning-soft text-warning underline",
                          )}
                        >
                          {word.word}
                          <span className="sr-only">
                            {word.matched ? " (heard)" : " (not heard)"}
                          </span>
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    This is based on speech-to-text, not a precise pronunciation
                    score. Background noise and microphone quality affect it.
                  </p>
                </div>
              )}
              {recorder.error && (
                <p className="text-sm text-danger">{recorder.error}</p>
              )}
              {recorder.state === "done" && (
                <Button onClick={() => onFinish(good, recorder.transcript)}>
                  {good ? "Great — continue" : "Continue"}
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              Speech recognition is not available in this browser.
            </p>
          )}
          <Button
            variant="secondary"
            onClick={() =>
              onFinish(true, "(self-assessed)", {
                deviceSkip: !recorder.supported,
              })
            }
          >
            I said it aloud (self-check)
          </Button>
        </div>
      )}
    </div>
  );
}
