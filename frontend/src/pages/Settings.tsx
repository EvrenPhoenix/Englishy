import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, Download, Trash, Upload } from "lucide-react";
import {
  GOALS,
  LANGUAGE_NAMES,
  LEVELS,
  LEVEL_LABELS,
  NATIVE_LANGUAGES,
  UI_LANGUAGES,
  type NativeLanguage,
} from "../../../shared/constants";
import { BRAND } from "../../../shared/brand";
import { useTranslate, type MessageKey } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import { usePageMeta } from "../lib/use-page-meta";
import { PageHeader, classes } from "../components/PageElements";
import { Button, ChoiceCard } from "../components/FormControls";
import {
  Dialog,
  Notice,
  Segmented,
  SelectField,
  SwitchRow,
} from "../components/Controls";
import { ThemeToggle } from "../components/ThemeToggle";
import { ListenButton } from "../components/SpeechControls";
import { englishVoices, speechSupported } from "../lib/speech";
import {
  clearAllData,
  clearConversations,
  createBackup,
  parseBackup,
  restoreBackup,
  type BackupFile,
} from "../lib/backup";

const dailyGoals = [5, 10, 15, 20, 30];
const speechRates = [0.75, 0.9, 1.1] as const;
const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

function Section({
  title,
  id,
  anchor,
  children,
}: {
  title: string;
  id: string;
  anchor?: string;
  children: ReactNode;
}) {
  return (
    <section id={anchor} aria-labelledby={id} className="scroll-mt-20">
      <h2 id={id} className="mb-2 px-1 text-sm font-medium text-muted">
        {title}
      </h2>
      <div className="card divide-y divide-border px-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        {description && (
          <div className="mt-0.5 text-sm text-muted">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Chips<T extends string | number>({
  label,
  values,
  selected,
  render,
  onToggle,
  multi,
}: {
  label: string;
  values: readonly T[];
  selected: readonly T[];
  render: (value: T) => ReactNode;
  onToggle: (value: T) => void;
  multi?: boolean;
}) {
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {values.map((value) => {
        const on = selected.includes(value);
        return (
          <button
            key={String(value)}
            type="button"
            role={multi ? undefined : "radio"}
            aria-checked={multi ? undefined : on}
            aria-pressed={multi ? on : undefined}
            onClick={() => onToggle(value)}
            className={classes(
              "h-10 rounded-full px-4 text-sm font-medium transition-colors",
              on ? "bg-text text-bg" : "bg-surface-2 hover:bg-surface-3",
            )}
          >
            {render(value)}
          </button>
        );
      })}
    </div>
  );
}

function languageOptions(codes: readonly NativeLanguage[]) {
  return codes.map((code) => {
    const name = LANGUAGE_NAMES[code];
    return {
      value: code,
      label:
        code === "other"
          ? "Other (explanations in simple English)"
          : name.native === name.english
            ? name.native
            : `${name.native} · ${name.english}`,
    };
  });
}

export function Settings() {
  const t = useTranslate();
  const { prefs, update } = usePreferences();
  usePageMeta({ title: t("settings.title"), noindex: true });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restored, setRestored] = useState<Awaited<
    ReturnType<typeof restoreBackup>
  > | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canSpeak = speechSupported();
  const location = useLocation();

  useEffect(() => {
    if (location.hash)
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [location.hash]);
  useEffect(() => {
    if (!canSpeak) return;
    const refresh = () => setVoices(englishVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, [canSpeak]);

  const download = async () => {
    const backup = await createBackup(prefs.saveConversations);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${BRAND.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const choose = async (file?: File) => {
    setImportError(null);
    setRestored(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES)
      return setImportError(
        `This file is too large to be a ${BRAND.name} backup file.`,
      );
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) return setImportError(parsed.error);
    setPending(parsed.file);
  };
  const restore = async (mode: "merge" | "replace") => {
    if (!pending) return;
    setRestored(await restoreBackup(pending, mode));
    setPending(null);
    setConfirmReplace(false);
    if (fileInput.current) fileInput.current.value = "";
  };
  const setLanguage = (language: string) =>
    void update({
      uiLanguage: language as (typeof UI_LANGUAGES)[number],
      nativeLanguage: language as NativeLanguage,
      explanationLanguage: language as NativeLanguage,
    });
  const translatesTips =
    prefs.nativeLanguage !== "en" && prefs.nativeLanguage !== "other";
  const goalChoices = dailyGoals.includes(prefs.dailyGoalMinutes)
    ? dailyGoals
    : [...dailyGoals, prefs.dailyGoalMinutes].sort((a, b) => a - b);
  const nearestRate = speechRates.reduce<number>(
    (best, rate) =>
      Math.abs(rate - prefs.speechRate) < Math.abs(best - prefs.speechRate)
        ? rate
        : best,
    speechRates[1],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />
      <div className="space-y-8">
        <Section title={t("settings.language")} id="s-language">
          <SelectField
            label={t("settings.myLanguage")}
            description={t("settings.myLanguageHelp")}
            value={prefs.uiLanguage}
            onChange={setLanguage}
            options={languageOptions(UI_LANGUAGES)}
          />
          {translatesTips && (
            <SwitchRow
              label={t("settings.tips")}
              description={t("settings.tipsHelp")}
              checked={prefs.showTranslations !== "never"}
              onChange={(on) =>
                void update({ showTranslations: on ? "auto" : "never" })
              }
            />
          )}
        </Section>

        <Section title={t("settings.learning")} id="s-learning">
          <div>
            <SelectField
              label={t("settings.level")}
              value={prefs.level}
              onChange={(level) => void update({ level })}
              options={LEVELS.map((level) => ({
                value: level,
                label: `${LEVEL_LABELS[level].code} · ${t(`level.${level}` as MessageKey)}`,
              }))}
            />
            <Link
              to="/placement"
              className="-mt-1 mb-4 inline-block rounded text-sm font-medium text-primary-text underline-offset-2 hover:underline"
            >
              {t("settings.levelCheck")}
            </Link>
          </div>
          <div className="space-y-3 py-4">
            <p className="font-medium">{t("settings.dailyGoal")}</p>
            <Chips
              label={t("settings.dailyGoal")}
              values={goalChoices}
              selected={[prefs.dailyGoalMinutes]}
              render={(n) => t("common.minutes", { n })}
              onToggle={(dailyGoalMinutes) => void update({ dailyGoalMinutes })}
            />
          </div>
          <div className="space-y-3 py-4">
            <p className="font-medium">{t("settings.goals")}</p>
            <Chips
              multi
              label={t("settings.goals")}
              values={[...GOALS]}
              selected={prefs.goals}
              render={(goal) => t(`goal.${goal}` as MessageKey)}
              onToggle={(goal) =>
                void update((current) => ({
                  goals: current.goals.includes(goal)
                    ? current.goals.filter((g) => g !== goal)
                    : [...current.goals, goal],
                }))
              }
            />
          </div>
          <Row
            label={t("settings.accent")}
            description={t("settings.accentHelp")}
          >
            <Segmented
              label={t("settings.accent")}
              value={prefs.variety}
              onChange={(variety) => void update({ variety })}
              options={[
                { value: "british", label: t("onboarding.british") },
                { value: "american", label: t("onboarding.american") },
              ]}
            />
          </Row>
        </Section>

        <Section title={t("settings.look")} id="s-look">
          <Row label={t("theme.label")}>
            <ThemeToggle compact={false} />
          </Row>
          <Row label={t("settings.textSize")}>
            <Segmented
              label={t("settings.textSize")}
              value={prefs.textSize}
              onChange={(textSize) => void update({ textSize })}
              options={[
                { value: "normal", label: t("settings.textNormal") },
                { value: "large", label: t("settings.textLarge") },
                { value: "xlarge", label: t("settings.textXLarge") },
              ]}
            />
          </Row>
          <SwitchRow
            label={t("settings.reducedMotion")}
            checked={prefs.reducedMotion}
            onChange={(reducedMotion) => void update({ reducedMotion })}
          />
        </Section>

        <Section title={t("settings.sound")} id="s-sound">
          {canSpeak ? (
            <>
              <Row label={t("settings.speed")}>
                <Segmented
                  label={t("settings.speed")}
                  value={nearestRate}
                  onChange={(speechRate) => void update({ speechRate })}
                  options={[
                    { value: speechRates[0], label: t("settings.slower") },
                    { value: speechRates[1], label: t("settings.normal") },
                    { value: speechRates[2], label: t("settings.faster") },
                  ]}
                />
              </Row>
              <div className="py-4">
                <ListenButton
                  text="Hello! This is how I sound."
                  label={t("settings.testVoice")}
                />
              </div>
            </>
          ) : (
            <p className="py-4 text-muted">
              Speech is not available in this browser. All lessons still work
              with text.
            </p>
          )}
        </Section>

        <Section title={t("settings.tutor")} id="s-tutor">
          <div className="py-4">
            <p id="correct-label" className="mb-3 font-medium">
              {t("settings.correct")}
            </p>
            <div
              className="grid gap-2"
              role="radiogroup"
              aria-labelledby="correct-label"
            >
              {(
                [
                  [
                    "major",
                    t("settings.correctMajor"),
                    t("settings.correctMajorHelp"),
                  ],
                  [
                    "immediate",
                    t("settings.correctAll"),
                    t("settings.correctAllHelp"),
                  ],
                  [
                    "end",
                    t("settings.correctNone"),
                    t("settings.correctNoneHelp"),
                  ],
                ] as const
              ).map(([mode, title, description]) => (
                <ChoiceCard
                  key={mode}
                  selected={prefs.correctionMode === mode}
                  onClick={() => void update({ correctionMode: mode })}
                  title={title}
                  description={description}
                />
              ))}
            </div>
          </div>
          <SwitchRow
            label={t("settings.keepChats")}
            description={t("settings.keepChatsHelp")}
            checked={prefs.saveConversations}
            onChange={(on) => {
              void update({ saveConversations: on });
              if (!on) void clearConversations();
            }}
          />
        </Section>

        <Section title={t("settings.data")} id="s-data" anchor="data">
          <div className="space-y-4 py-5">
            <p className="text-sm text-muted">{t("settings.dataHelp")}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                icon={Download}
                onClick={() => void download()}
              >
                {t("settings.export")}
              </Button>
              <Button
                variant="secondary"
                icon={Upload}
                onClick={() => fileInput.current?.click()}
              >
                {t("settings.import")}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-label={t("settings.import")}
                onChange={(event) => void choose(event.target.files?.[0])}
              />
            </div>
            {importError && <Notice tone="danger">{importError}</Notice>}
            {restored && (
              <Notice tone="success" title={t("settings.backupDone")}>
                {"Added or updated "}
                {restored.lessons}
                {" lessons, "}
                {restored.activities}
                {" activities, "}
                {restored.vocab}
                {" words and "}
                {restored.conversations}
                {" conversations."}
              </Notice>
            )}
            {pending && (
              <Notice
                tone="info"
                title="Ready to restore"
                action={
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void restore("merge")}>
                      Add to my progress (safe)
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmReplace(true)}
                    >
                      Replace my progress
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPending(null)}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                }
              >
                {"Backup from "}
                {new Date(pending.exportedAt).toLocaleString()}
                {" with "}
                {pending.data.lessons.length}
                {" lessons and "}
                {pending.data.vocab.length}
                {
                  " words. Adding keeps your best results and never deletes anything."
                }
              </Notice>
            )}
          </div>
          <div className="py-5">
            <Button
              variant="dangerGhost"
              icon={Trash}
              className="-ms-3"
              onClick={() => setConfirmClear(true)}
            >
              {t("settings.clear")}
            </Button>
            {cleared && (
              <p className="mt-2 text-sm text-success" role="status">
                All learning data was deleted from this device.
              </p>
            )}
          </div>
        </Section>

        <details className="group card px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block font-medium">{t("settings.more")}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {t("settings.moreHelp")}
              </span>
            </span>
            <ChevronDown
              className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="divide-y divide-border border-t border-border">
            <SelectField
              label={t("settings.menuLanguage")}
              value={prefs.uiLanguage}
              onChange={(uiLanguage) =>
                void update({
                  uiLanguage: uiLanguage as (typeof UI_LANGUAGES)[number],
                })
              }
              options={languageOptions(UI_LANGUAGES)}
            />
            <SelectField
              label={t("settings.firstLanguage")}
              value={prefs.nativeLanguage}
              onChange={(nativeLanguage) => void update({ nativeLanguage })}
              options={languageOptions(NATIVE_LANGUAGES)}
            />
            <SelectField
              label={t("settings.explainLanguage")}
              value={prefs.explanationLanguage}
              onChange={(explanationLanguage) =>
                void update({ explanationLanguage })
              }
              options={languageOptions(
                NATIVE_LANGUAGES.filter((code) => code !== "other"),
              )}
            />
            {translatesTips && prefs.showTranslations !== "never" && (
              <SwitchRow
                label={t("settings.tipsAll")}
                description={t("settings.tipsAllHelp")}
                checked={prefs.showTranslations === "always"}
                onChange={(on) =>
                  void update({ showTranslations: on ? "always" : "auto" })
                }
              />
            )}
            {canSpeak && voices.length > 0 && (
              <SelectField
                label={t("settings.voice")}
                value={prefs.voiceURI ?? ""}
                onChange={(voiceURI) =>
                  void update({ voiceURI: voiceURI || null })
                }
                options={[
                  { value: "", label: "Automatic" },
                  ...voices.map((voice) => ({
                    value: voice.voiceURI,
                    label: `${voice.name} (${voice.lang})`,
                  })),
                ]}
              />
            )}
            <SwitchRow
              label={t("settings.streaks")}
              checked={prefs.streaksEnabled}
              onChange={(streaksEnabled) => void update({ streaksEnabled })}
            />
          </div>
        </details>
      </div>

      <Dialog
        open={confirmReplace}
        onClose={() => setConfirmReplace(false)}
        title="Replace your progress?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmReplace(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={() => void restore("replace")}>
              Replace
            </Button>
          </>
        }
      >
        Your current lessons, activity, words and conversations on this device
        will be removed and replaced by the backup. Consider downloading a
        backup first.
      </Dialog>
      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={`${t("settings.clear")}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await clearAllData();
                setConfirmClear(false);
                setCleared(true);
              }}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        This permanently deletes your preferences, lesson progress, activity
        history, saved words and chats from this browser. This cannot be undone.
        Nothing is stored on our servers.
      </Dialog>
    </div>
  );
}
