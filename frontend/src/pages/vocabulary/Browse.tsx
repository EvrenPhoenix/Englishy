import { useDeferredValue, useMemo, useState } from "react";
import { BookmarkCheck, BookmarkPlus, Search } from "lucide-react";
import { vocabulary } from "../../data/vocabulary";
import { vocabularyTopics } from "../../data/vocabulary-topics";
import { usePreferences } from "../../components/PreferencesProvider";
import { classes, Button } from "../../components/ui";
import { ListenButton } from "../../components/SpeechControls";
import { contentIcon } from "../../components/content-icons";
import { saveWord, wordFromBank } from "../../lib/vocab";

export function Browse({ saved }: { saved: Set<string> }) {
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
