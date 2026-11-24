import { useSearchParams } from "react-router";
import { vocabulary } from "../../data/vocabulary";
import { useTranslate } from "../../i18n/provider";
import { PageHeader, classes } from "../../components/ui";
import { usePageMeta } from "../../lib/use-page-meta";
import { useStoredValue } from "../../lib/use-stored-value";
import { learnerDatabase } from "../../lib/storage-keys";
import { isDue, readVocab } from "../../lib/vocab";
import { Notebook } from "./Notebook";
import { Browse } from "./Browse";
import { ReviewChooser } from "./Review";

type Tab = "notebook" | "review" | "browse";

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
