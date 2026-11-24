import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  BookMarked,
  BookmarkCheck,
  BookmarkPlus,
  Brain,
  Keyboard,
  Layers,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import { LEVEL_LABELS } from "../../../shared/constants";
import { vocabulary } from "../data/vocabulary";
import { vocabularyTopics } from "../data/vocabulary-topics";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import {
  Badge,
  EmptyState,
  PageHeader,
  classes,
} from "../components/PageElements";
import { Button } from "../components/FormControls";
import { Dialog } from "../components/Controls";
import { ListenButton } from "../components/SpeechControls";
import { contentIcon } from "../components/content-icons";
import { usePageMeta } from "../lib/use-page-meta";
import { useStoredValue } from "../lib/use-stored-value";
import { useActiveTime } from "../lib/use-active-time";
import { logActivity, newId } from "../lib/activity";
import { learnerDatabase } from "../lib/storage-keys";
import { checkText, type CheckResult } from "../lib/validate";
import {
  isDue,
  newSrs,
  nextReviewLabel,
  readVocab,
  removeWord,
  saveWord,
  scheduleReview,
  wordFromBank,
  wordStage,
  type SavedWord,
  type WordStage,
} from "../lib/vocab";

type Tab = "notebook" | "review" | "browse";
const stageTones: Record<
  WordStage,
  "neutral" | "accent" | "indigo" | "success"
> = {
  new: "neutral",
  learning: "accent",
  reviewing: "indigo",
  mastered: "success",
};

export function VocabularyPage() {
  const t = useTranslate();
  usePageMeta({
    title: "English vocabulary",
    description:
      "Learn essential English words by topic with meanings, pronunciation, examples and spaced repetition review.",
    path: "/vocabulary",
  });
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("review")
    ? "review"
    : params.get("tab") === "browse"
      ? "browse"
      : "notebook";
  const words = useStoredValue(
    learnerDatabase.stores.vocab,
    readVocab,
    undefined,
  );
  const due = (words ?? []).filter((word) => isDue(word.srs));
  const go = (next: Tab) =>
    setParams(
      next === "review"
        ? { review: "1" }
        : next === "browse"
          ? { tab: "browse" }
          : {},
      { replace: true },
    );
  return (
    <div>
      <PageHeader
        title={t("nav.vocabulary")}
        subtitle="Save words, review them with spaced repetition and track your mastery. Works offline."
      />
      <div
        role="tablist"
        aria-label="Vocabulary sections"
        className="relative mb-6 inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-2 p-1"
      >
        {(
          [
            ["notebook", `My words${words ? ` (${words.length})` : ""}`],
            ["review", `Review${due.length ? ` (${due.length})` : ""}`],
            ["browse", "Browse topics"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => go(id)}
            className={classes(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              tab === id
                ? "bg-raised text-text shadow-sm ring-1 ring-border"
                : "text-muted hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "notebook" && (
        <Notebook
          words={words}
          onBrowse={() => go("browse")}
          onReview={() => go("review")}
        />
      )}
      {tab === "browse" && (
        <Browse saved={new Set((words ?? []).map((word) => word.id))} />
      )}
      {tab === "review" && (
        <ReviewChooser words={words ?? []} onBrowse={() => go("browse")} />
      )}
    </div>
  );
}

function Notebook({
  words,
  onBrowse,
  onReview,
}: {
  words: SavedWord[] | undefined;
  onBrowse: () => void;
  onReview: () => void;
}) {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.toLowerCase().trim());
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<SavedWord | null>(null);
  const { prefs } = usePreferences();
  if (!words) return null;
  const shown = words
    .filter(
      (word) =>
        !search ||
        [word.word, word.definition, word.translation ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search),
    )
    .sort((a, b) => a.word.localeCompare(b.word));
  const counts = words.reduce(
    (totals, word) => {
      totals[wordStage(word.srs)] += 1;
      return totals;
    },
    { new: 0, learning: 0, reviewing: 0, mastered: 0 } as Record<
      WordStage,
      number
    >,
  );
  return (
    <div className="space-y-4">
      {words.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["new", "learning", "reviewing", "mastered"] as const).map(
            (stage) => (
              <div key={stage} className="card p-4">
                <p className="text-2xl font-semibold">{counts[stage]}</p>
                <p className="text-sm text-muted capitalize">{stage}</p>
              </div>
            ),
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search your words</span>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search your words"
            className="h-11 w-full rounded-xl border border-border-strong bg-surface ps-10 pe-3"
          />
        </label>
        <Button icon={Plus} variant="secondary" onClick={() => setAdding(true)}>
          Add a word
        </Button>
        <Button icon={Layers} onClick={onReview} disabled={!words.length}>
          Review
        </Button>
      </div>
      {words.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Your notebook is empty"
          action={<Button onClick={onBrowse}>Browse topics</Button>}
        >
          Save words from lessons or browse beginner topics. You can also add
          your own words.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((word) => {
            const stage = wordStage(word.srs);
            return (
              <li key={word.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold" lang="en">
                      {word.word}{" "}
                      <span className="text-sm font-normal text-muted">
                        {word.pos}
                      </span>
                    </p>
                    {word.ipa && (
                      <p
                        className="text-sm text-muted"
                        title="Broad British IPA"
                      >
                        {word.ipa}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ListenButton
                      text={word.word}
                      label=""
                      size="sm"
                      revealFallback={false}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash}
                      aria-label={`Remove ${word.word}`}
                      onClick={() => setRemoving(word)}
                    />
                  </div>
                </div>
                <p className="mt-2">{word.definition}</p>
                {word.translation && (
                  <p
                    className="mt-1 text-sm text-muted"
                    lang={prefs.nativeLanguage}
                  >
                    {word.translation}
                  </p>
                )}
                {word.examples[0] && (
                  <p className="mt-2 text-sm italic">
                    {"“"}
                    {word.examples[0]}
                    {"”"}
                  </p>
                )}
                {(word.collocations?.length ||
                  word.synonyms?.length ||
                  word.antonyms?.length) && (
                  <p className="mt-2 text-xs text-muted">
                    {word.collocations?.length
                      ? `Often with: ${word.collocations.join(", ")}. `
                      : ""}
                    {word.synonyms?.length
                      ? `Similar: ${word.synonyms.join(", ")}. `
                      : ""}
                    {word.antonyms?.length
                      ? `Opposite: ${word.antonyms.join(", ")}.`
                      : ""}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={stageTones[stage]} className="capitalize">
                    {stage}
                  </Badge>
                  <Badge>{LEVEL_LABELS[word.level].code}</Badge>
                  {word.custom && <Badge tone="indigo">My word</Badge>}
                  <span className="text-xs text-muted">
                    {isDue(word.srs)
                      ? "Due now"
                      : `Next review ${new Date(word.srs.due).toLocaleDateString()}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AddWordDialog open={adding} onClose={() => setAdding(false)} />
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove "${removing?.word}"?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removing) void removeWord(removing.id);
                setRemoving(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        Its review history will be deleted. You can save it again later.
      </Dialog>
    </div>
  );
}

const emptyDraft = {
  word: "",
  pos: "noun",
  definition: "",
  translation: "",
  example: "",
};
const partsOfSpeech = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "preposition",
  "other",
];

function AddWordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { prefs } = usePreferences();
  const [draft, setDraft] = useState(emptyDraft);
  const valid =
    draft.word.trim().length > 0 && draft.definition.trim().length > 0;
  const save = async () => {
    if (!valid) return;
    await saveWord({
      id: newId("custom:"),
      word: draft.word.trim().slice(0, 80),
      pos: draft.pos,
      definition: draft.definition.trim().slice(0, 500),
      translation: draft.translation.trim().slice(0, 200) || undefined,
      examples: draft.example.trim()
        ? [draft.example.trim().slice(0, 300)]
        : [],
      level: prefs.level,
      topic: "custom",
      custom: true,
      savedAt: new Date().toISOString(),
      srs: newSrs(),
    });
    setDraft(emptyDraft);
    onClose();
  };
  const field = (
    key: keyof typeof emptyDraft,
    label: string,
    required = false,
    lang?: string,
  ) => (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <input
        value={draft[key]}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
        lang={lang}
        required={required}
        className="mt-1 h-11 w-full rounded-xl border border-border-strong bg-surface px-3"
      />
    </label>
  );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add your own word"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={!valid}>
            Save word
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {field("word", "Word or phrase", true, "en")}
        <label className="block">
          <span className="text-sm font-medium">Part of speech</span>
          <select
            value={draft.pos}
            onChange={(event) =>
              setDraft({ ...draft, pos: event.target.value })
            }
            className="mt-1 h-11 w-full rounded-xl border border-border-strong bg-surface px-3"
          >
            {partsOfSpeech.map((pos) => (
              <option key={pos}>{pos}</option>
            ))}
          </select>
        </label>
        {field("definition", "Meaning", true)}
        {field(
          "translation",
          "Translation (optional)",
          false,
          prefs.nativeLanguage,
        )}
        {field("example", "Example sentence (optional)", false, "en")}
      </div>
    </Dialog>
  );
}

function Browse({ saved }: { saved: Set<string> }) {
  const { prefs } = usePreferences();
  const [topic, setTopic] = useState(vocabularyTopics[0].id);
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.toLowerCase().trim());
  const shown = useMemo(
    () =>
      vocabulary.filter((entry) =>
        search
          ? [entry.word, entry.definition, ...Object.values(entry.translations)]
              .join(" ")
              .toLowerCase()
              .includes(search)
          : entry.topic === topic,
      ),
    [topic, search],
  );
  const language =
    prefs.nativeLanguage !== "en" && prefs.nativeLanguage !== "other"
      ? prefs.nativeLanguage
      : null;
  return (
    <div>
      <label className="relative mb-4 block">
        <span className="sr-only">Search all words</span>
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder={`Search ${vocabulary.length} words in English or your language`}
          className="h-11 w-full rounded-xl border border-border-strong bg-surface ps-10 pe-3"
        />
      </label>
      {!search && (
        <div
          className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Topics"
        >
          {vocabularyTopics.map((item) => {
            const Icon = contentIcon(item.icon);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={topic === item.id}
                onClick={() => setTopic(item.id)}
                className={classes(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                  topic === item.id
                    ? "border-primary bg-primary-soft text-primary-text"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <Icon className="size-4" aria-hidden /> {item.title}
              </button>
            );
          })}
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((entry) => {
          const isSaved = saved.has(`bank:${entry.id}`);
          const translation = language
            ? entry.translations[language as keyof typeof entry.translations]
            : undefined;
          return (
            <li key={entry.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold" lang="en">
                    {entry.word}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.pos}
                    {" · "}
                    <span title="Broad British IPA">{entry.ipa}</span>
                  </p>
                </div>
                <ListenButton
                  text={entry.word}
                  label=""
                  size="sm"
                  revealFallback={false}
                />
              </div>
              <p className="mt-2 flex-1 text-sm">{entry.definition}</p>
              {language && translation && (
                <p className="mt-1 text-sm text-muted" lang={language}>
                  {translation}
                </p>
              )}
              <p className="mt-2 text-sm italic text-muted">
                {"“"}
                {entry.examples[0]}
                {"”"}
              </p>
              <Button
                className="mt-3 self-start"
                size="sm"
                variant={isSaved ? "ghost" : "secondary"}
                icon={isSaved ? BookmarkCheck : BookmarkPlus}
                disabled={isSaved}
                onClick={() =>
                  void saveWord(wordFromBank(entry, prefs.nativeLanguage))
                }
              >
                {isSaved ? "Saved" : "Save"}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-muted">
        IPA shows a broad British pronunciation for reference. American
        pronunciation can differ. Translations give the most common meaning;
        context can change them.
      </p>
    </div>
  );
}

function ReviewChooser({
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
