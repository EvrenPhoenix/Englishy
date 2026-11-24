import { useDeferredValue, useState } from "react";
import { BookMarked, Layers, Plus, Search, Trash } from "lucide-react";
import { LEVEL_LABELS } from "../../../../shared/constants";
import { usePreferences } from "../../components/PreferencesProvider";
import { Badge, EmptyState, Button, Dialog } from "../../components/ui";
import { ListenButton } from "../../components/SpeechControls";
import {
  isDue,
  removeWord,
  wordStage,
  type SavedWord,
  type WordStage,
} from "../../lib/vocab";
import { AddWordDialog } from "./AddWordDialog";
import { Browse } from "./Browse";

const stageTones: Record<
  WordStage,
  "neutral" | "accent" | "indigo" | "success"
> = {
  new: "neutral",
  learning: "accent",
  reviewing: "indigo",
  mastered: "success",
};

export function Notebook({
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
