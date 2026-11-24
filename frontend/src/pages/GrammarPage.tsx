import * as React from "react";
import { Link } from "react-router";
import { usePageMeta } from "../lib/use-page-meta";
import { useTranslate } from "../i18n/provider";
import { Search } from "lucide-react";
import { LEVEL_LABELS } from "../../../shared/constants";
import { grammar } from "../data/grammar";
import { classes, PageHeader, EmptyState, Badge } from "../components/ui";
const categories = [
  "All",
  "Words",
  "Verbs and tenses",
  "Sentences",
  "Advanced structures",
];
export function GrammarPage() {
  const translate = useTranslate();
  usePageMeta({
    title: "English grammar library",
    description:
      "Clear, simple explanations of English grammar with examples, common mistakes and practice exercises.",
    path: "/grammar",
  });
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const query = React.useDeferredValue(search.trim().toLowerCase());
  const visibleTopics = React.useMemo(
    () =>
      grammar
        .filter((topic) => category === "All" || topic.category === category)
        .filter(
          (topic) =>
            !query ||
            [topic.title, topic.summary, ...topic.examples, ...topic.simple]
              .join(" ")
              .toLowerCase()
              .includes(query),
        ),
    [query, category],
  );
  return (
    <div>
      <PageHeader
        title={translate("nav.grammar")}
        subtitle={`${grammar.length} topics explained simply, with examples, common mistakes and practice. Available offline.`}
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{translate("common.search")}</span>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-muted"
            aria-hidden={true}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            placeholder="Search grammar, e.g. past, articles, questions"
            className="h-11 w-full rounded-xl border border-border-strong bg-surface ps-10 pe-3"
          />
        </label>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Category"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={classes(
                "rounded-full border px-3 py-1.5 text-sm",
                category === item
                  ? "border-primary bg-primary-soft text-primary-text"
                  : "border-border hover:bg-surface-2",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {visibleTopics.length === 0 ? (
        <EmptyState icon={Search} title="No topics found">
          Try another word, or ask the AI tutor.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTopics.map((topic) => (
            <li key={topic.id}>
              <Link
                to={`/grammar/${topic.id}`}
                className="card block h-full p-4 card-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="primary">{LEVEL_LABELS[topic.level].code}</Badge>
                  <span className="text-xs text-muted">{topic.category}</span>
                </div>
                <h2 className="mt-2 font-semibold">{topic.title}</h2>
                <p className="mt-1 text-sm text-muted">{topic.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
