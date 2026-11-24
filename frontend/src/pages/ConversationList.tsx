import * as React from "react";
import { Link } from "react-router";
import { usePageMeta } from "../lib/use-page-meta";
import { useTranslate } from "../i18n/provider";
import { LEVELS, LEVEL_LABELS } from "../../../shared/constants";
import { usePreferences } from "../components/PreferencesProvider";
import { Badge, PageHeader, classes } from "../components/PageElements";
import { contentIcon } from "../components/content-icons";
import { scenarioCategories } from "../data/catalogues";
import { scenarios } from "../data/scenarios";
import { scenarioChats } from "../lib/database";
import { learnerDatabase } from "../lib/storage-keys";
import { useStoredValue } from "../lib/use-stored-value";
export function ConversationList() {
  const translate = useTranslate();
  const { prefs } = usePreferences();
  usePageMeta({
    title: "English conversation practice",
    description:
      "Practise real English conversations with an AI role-play partner: ordering food, directions, hotels, job interviews and more.",
    path: "/conversation",
  });
  const [category, setCategory] = React.useState("all");
  const chats = useStoredValue(
    learnerDatabase.stores.conversations,
    scenarioChats,
    undefined,
  );
  const practised = new Set(
    (chats ?? []).filter((chat) => chat.report).map((chat) => chat.scenarioId),
  );
  const learnerLevel = LEVELS.indexOf(prefs.level);
  const visibleScenarios = scenarios.filter(
    (scenario) => category === "all" || scenario.category === category,
  );
  return (
    <div>
      <PageHeader
        title={translate("nav.conversation")}
        subtitle="Role-play everyday situations with an AI partner. Choose how much help and correction you want. Needs internet."
      />
      <div
        className="mb-5 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Category"
      >
        {scenarioCategories.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={category === option.id}
            onClick={() => setCategory(option.id)}
            className={classes(
              "h-10 rounded-full px-4 text-sm font-medium transition-colors",
              category === option.id
                ? "bg-text text-bg"
                : "bg-surface-2 hover:bg-surface-3",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleScenarios.map((scenario) => {
          const Icon = contentIcon(scenario.icon);
          const challenge =
            LEVELS.indexOf(scenario.minLevel) > Math.max(learnerLevel, 0) + 1;
          return (
            <li key={scenario.id}>
              <Link
                to={`/conversation/${scenario.id}`}
                className="card card-hover flex h-full flex-col p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-text"
                    aria-hidden={true}
                  >
                    <Icon className="size-5.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{scenario.title}</h2>
                    <p className="text-sm text-muted">{scenario.setting}</p>
                  </div>
                </div>
                <ul className="mt-3 flex-1 space-y-1 text-sm">
                  {scenario.objectives.map((objective) => (
                    <li key={objective}>
                      {"• "}
                      {objective}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="primary">
                    {"From "}
                    {LEVEL_LABELS[scenario.minLevel].code}
                  </Badge>
                  {challenge && <Badge tone="accent">Challenge</Badge>}
                  {practised.has(scenario.id) && (
                    <Badge tone="success">Practised</Badge>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
