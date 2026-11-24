import { useEffect, useRef, useState } from "react";
import { Brain, Keyboard, Layers } from "lucide-react";
import { usePreferences } from "../../components/PreferencesProvider";
import { EmptyState, classes, Button } from "../../components/ui";
import { ListenButton } from "../../components/SpeechControls";
import { useActiveTime } from "../../lib/use-active-time";
import { logActivity } from "../../lib/activity";
import { checkText, type CheckResult } from "../../lib/validate";
import {
  isDue,
  nextReviewLabel,
  saveWord,
  scheduleReview,
  type SavedWord,
} from "../../lib/vocab";
import { Browse } from "./Browse";

export function ReviewChooser({
  words,
  onBrowse,
}: {
  words: SavedWord[];
  onBrowse: () => void;
}) {
  const [mode, setMode] = useState<"cards" | "recall" | null>(null);
  const due = words.filter((word) => isDue(word.srs));
  if (!words.length)
    return (
      <EmptyState
        icon={Layers}
        title="No words to review yet"
        action={<Button onClick={onBrowse}>Browse topics</Button>}
      >
        Save some words first.
      </EmptyState>
    );
  if (mode)
    return (
      <ReviewSession
        key={mode}
        mode={mode}
        words={(due.length ? due : words).slice(0, 20)}
        onExit={() => setMode(null)}
      />
    );
  return (
    <div className="space-y-4">
      <p className="text-muted">
        {due.length
          ? `${due.length} word${due.length > 1 ? "s are" : " is"} due for review.`
          : "Nothing is due right now. You can still practise all your words."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("cards")}
          className="card flex items-start gap-3 p-5 text-start card-hover"
        >
          <Layers className="mt-0.5 size-6 text-primary" aria-hidden />
          <span>
            <span className="block font-semibold">Flashcards</span>
            <span className="text-sm text-muted">
              See the word, remember the meaning, then rate how well you knew
              it.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("recall")}
          className="card flex items-start gap-3 p-5 text-start card-hover"
        >
          <Keyboard className="mt-0.5 size-6 text-indigo" aria-hidden />
          <span>
            <span className="block font-semibold">Recall test</span>
            <span className="text-sm text-muted">
              See the meaning and type the English word. Checked automatically.
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

const grades = [
  [0, "Again"],
  [3, "Hard"],
  [4, "Good"],
  [5, "Easy"],
] as const;

function ReviewSession({
  mode,
  words,
  onExit,
}: {
  mode: "cards" | "recall";
  words: SavedWord[];
  onExit: () => void;
}) {
  const { prefs } = usePreferences();
  const activeTime = useActiveTime();
  const [queue, setQueue] = useState(() =>
    [...words].sort(() => Math.random() - 0.5),
  );
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [finished, setFinished] = useState(false);
  const logged = useRef(false);
  const card = queue[0];

  const finish = async (count: number) => {
    setFinished(true);
    if (logged.current || count === 0) return;
    logged.current = true;
    await logActivity({
      type: "flashcards",
      title: mode === "cards" ? "Flashcard review" : "Vocabulary recall test",
      durationSec: Math.min(activeTime.take(), 3600),
      xp: count,
      total: count,
      correct: undefined,
    });
  };
  const grade = async (value: number) => {
    if (!card) return;
    const updated = { ...card, srs: scheduleReview(card.srs, value) };
    await saveWord(updated);
    const rest = queue.slice(1);
    // "Again" puts the card back at the end of this session.
    const next = value === 0 ? [...rest, updated] : rest;
    const count = reviewed + 1;
    setReviewed(count);
    setRevealed(false);
    setTyped("");
    setResult(null);
    if (!next.length) void finish(count);
    setQueue(next);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement).tagName === "INPUT" ||
        finished ||
        !card
      )
        return;
      if (
        mode === "cards" &&
        !revealed &&
        (event.key === " " || event.key === "Enter")
      ) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(event.key))
        void grade([0, 3, 4, 5][Number(event.key) - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished || !card)
    return (
      <div className="card p-8 text-center">
        <Brain className="mx-auto size-10 text-primary" aria-hidden />
        <p className="mt-3 text-xl font-semibold">Review complete</p>
        <p className="mt-1 text-muted">
          {"You reviewed "}
          {reviewed}
          {" card"}
          {reviewed === 1 ? "" : "s"}
          {". Each word will come back when it is due."}
        </p>
        <Button className="mt-5" onClick={onExit}>
          Done
        </Button>
      </div>
    );
  const translation = card.translation;
  const check = () => {
    setResult(checkText(typed, [card.word]));
    setRevealed(true);
  };
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          {queue.length}
          {" left"}
        </span>
        <button
          type="button"
          onClick={() => void finish(reviewed).then(onExit)}
          className="hover:text-text"
        >
          End session
        </button>
      </div>
      <div className="card p-6 text-center sm:p-8">
        {mode === "cards" ? (
          <>
            <p className="text-3xl font-semibold" lang="en">
              {card.word}
            </p>
            {card.ipa && <p className="mt-1 text-muted">{card.ipa}</p>}
            <div className="mt-3 flex justify-center">
              <ListenButton
                text={card.word}
                label="Listen"
                size="sm"
                revealFallback={false}
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Which English word means…</p>
            <p className="mt-2 text-xl font-medium">{card.definition}</p>
            {translation && (
              <p className="mt-1 text-muted" lang={prefs.nativeLanguage}>
                {"("}
                {translation}
                {")"}
              </p>
            )}
            {!revealed && (
              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (typed.trim()) check();
                }}
              >
                <label className="sr-only" htmlFor="recall">
                  Type the word
                </label>
                <input
                  id="recall"
                  autoFocus
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  lang="en"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="h-12 w-full rounded-xl border-2 border-border-strong bg-surface px-4 text-center text-lg"
                />
                <div className="mt-3 flex justify-center gap-2">
                  <Button type="submit" disabled={!typed.trim()}>
                    Check
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setResult("incorrect");
                      setRevealed(true);
                    }}
                  >
                    I don't know
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
        {revealed && (
          <div className="mt-6 border-t border-border pt-5 text-start">
            {mode === "recall" && (
              <p
                className={classes(
                  "mb-3 rounded-lg px-3 py-2 font-medium",
                  result === "correct"
                    ? "bg-success-soft"
                    : result === "almost"
                      ? "bg-warning-soft"
                      : "bg-danger-soft",
                )}
                role="status"
              >
                {result === "correct"
                  ? "Correct!"
                  : result === "almost"
                    ? `Almost! The spelling is "${card.word}".`
                    : `The word is "${card.word}".`}
              </p>
            )}
            {mode === "cards" && <p className="text-lg">{card.definition}</p>}
            {mode === "cards" && translation && (
              <p className="mt-1 text-muted" lang={prefs.nativeLanguage}>
                {translation}
              </p>
            )}
            {card.examples[0] && (
              <p className="mt-2 italic">
                {"“"}
                {card.examples[0]}
                {"”"}
              </p>
            )}
          </div>
        )}
      </div>
      {mode === "cards" && !revealed && (
        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={() => setRevealed(true)}
        >
          Show meaning
        </Button>
      )}
      {revealed && (
        <div className="mt-4">
          <p className="mb-2 text-center text-sm text-muted">
            How well did you know it?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {grades
              .filter(
                ([value]) =>
                  mode === "cards" || result !== "correct" || value !== 0,
              )
              .map(([value, label], i) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void grade(value)}
                  className={classes(
                    "rounded-xl border-2 px-2 py-3 text-center",
                    mode === "recall" &&
                      ((result === "correct" && value === 4) ||
                        (result === "almost" && value === 3) ||
                        (result === "incorrect" && value === 0))
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-muted">
                    {nextReviewLabel(card.srs, value)}
                  </span>
                  <span className="sr-only">
                    {"Shortcut "}
                    {i + 1}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
