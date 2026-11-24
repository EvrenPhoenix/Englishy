import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { usePreferences } from "../../components/PreferencesProvider";
import { Button } from "../../components/ui";
import { ListenButton } from "../../components/SpeechControls";
import { useStoredValue } from "../../lib/use-stored-value";
import { learnerDatabase } from "../../lib/storage-keys";
import {
  findBankWord,
  readVocab,
  saveWord,
  saveWords,
  wordFromBank,
} from "../../lib/vocab";

const savedWordIds = async () =>
  new Set((await readVocab()).map((word) => word.id));

/** Bank words used in a lesson, each with a save button. */
export function LessonWords({ ids }: { ids: string[] }) {
  const { prefs } = usePreferences();
  const saved = useStoredValue(
    learnerDatabase.stores.vocab,
    savedWordIds,
    undefined,
  );
  const words = ids.map(findBankWord).filter((word) => !!word);
  if (!words.length) return null;
  const unsaved = words.filter((word) => !saved?.has(`bank:${word.id}`));
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Words from this lesson</h2>
          <p className="text-sm text-muted">
            Save words to review them with flashcards.
          </p>
        </div>
        {unsaved.length > 1 && (
          <Button
            size="sm"
            variant="soft"
            icon={BookmarkPlus}
            onClick={() =>
              void saveWords(
                unsaved.map((word) => wordFromBank(word, prefs.nativeLanguage)),
              )
            }
          >
            Save all
          </Button>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {words.map((word) => {
          const isSaved = saved?.has(`bank:${word.id}`);
          const translation =
            prefs.nativeLanguage !== "en" && prefs.nativeLanguage !== "other"
              ? word.translations[prefs.nativeLanguage]
              : undefined;
          return (
            <li
              key={word.id}
              className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-medium" lang="en">
                  {word.word}{" "}
                  <span className="text-xs font-normal text-muted">
                    {word.pos}
                  </span>
                </p>
                <p className="truncate text-sm text-muted">
                  {translation ? (
                    <span lang={prefs.nativeLanguage}>{translation}</span>
                  ) : (
                    word.definition
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ListenButton
                  text={word.word}
                  label=""
                  size="sm"
                  revealFallback={false}
                />
                <Button
                  size="sm"
                  variant={isSaved ? "ghost" : "secondary"}
                  icon={isSaved ? BookmarkCheck : BookmarkPlus}
                  disabled={isSaved}
                  onClick={() =>
                    void saveWord(wordFromBank(word, prefs.nativeLanguage))
                  }
                  aria-label={
                    isSaved ? `${word.word} saved` : `Save ${word.word}`
                  }
                >
                  <span className="sr-only sm:not-sr-only">
                    {isSaved ? "Saved" : "Save"}
                  </span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
