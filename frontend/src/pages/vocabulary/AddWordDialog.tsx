import { useState } from "react";
import { usePreferences } from "../../components/PreferencesProvider";
import { Button, Dialog } from "../../components/ui";
import { newId } from "../../lib/activity";
import { newSrs, saveWord } from "../../lib/vocab";

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

export function AddWordDialog({
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
