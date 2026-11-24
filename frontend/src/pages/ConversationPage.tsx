import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CircleCheck,
  ClipboardList,
  Languages,
  Lightbulb,
  MessageSquareQuote,
  Mic,
  RefreshCw,
  Sparkles,
  Square,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import {
  LEVEL_LABELS,
  LIMITS,
  type CorrectionMode,
} from "../../../shared/constants";
import { getScenario, type Scenario } from "../../../shared/scenarios";
import {
  conversationReportSchema,
  type ConversationReport,
} from "../../../shared/schemas";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import { Badge, classes } from "../components/PageElements";
import { Button, ButtonLink, ChoiceCard } from "../components/FormControls";
import { Notice, Segmented } from "../components/Controls";
import {
  ChatAction,
  LearnerBubble,
  TutorMark,
  TutorMessage,
  TypingIndicator,
} from "../components/ChatMessages";
import { Composer } from "../components/Composer";
import { Markdown } from "../components/Markdown";
import { useRecorder } from "../components/SpeechControls";
import { contentIcon } from "../components/content-icons";
import { usePageMeta } from "../lib/use-page-meta";
import { useAiStatus } from "../lib/use-ai-status";
import { useAiProfile } from "../lib/use-ai-profile";
import { useOnline } from "../lib/use-online";
import { useActiveTime } from "../lib/use-active-time";
import { useChat, type ChatMessage } from "../lib/use-chat";
import { logActivity, newId } from "../lib/activity";
import { saveConversation } from "../lib/conversations";
import { aiErrorMessage, postJson } from "../lib/ai";
import { speak, speechSupported, stopSpeaking } from "../lib/speech";
import { NotFound } from "./NotFound";

type Difficulty = "easy" | "standard" | "challenging";

/** The partner's first name when the role starts with one ("Maria, a waiter…"). */
function partnerName(scenario: Scenario) {
  const first = scenario.aiRole.split(",")[0].trim();
  return /^[A-Z]/.test(first) && first.length <= 20 ? first : undefined;
}
/** Reply text for speech: no tips line and no Markdown symbols. */
function speakableReply(text: string) {
  return text
    .replace(/💡.*$/s, "")
    .replace(/[*_#`>]/g, "")
    .trim();
}

function ScrollPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
        {children}
      </div>
    </div>
  );
}

export function ConversationPage() {
  const t = useTranslate();
  const { scenarioId = "" } = useParams();
  const scenario = getScenario(scenarioId);
  usePageMeta({
    title: scenario
      ? `${scenario.title} · Conversation practice`
      : "Conversation",
    description: scenario?.setting,
    path: `/conversation/${scenarioId}`,
    noindex: !scenario,
  });
  const { prefs } = usePreferences();
  const [started, setStarted] = useState<{
    difficulty: Difficulty;
    correction: CorrectionMode;
  } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    ["pre-a1", "a1"].includes(prefs.level) ? "easy" : "standard",
  );
  const [correction, setCorrection] = useState<CorrectionMode>(
    prefs.correctionMode,
  );
  const status = useAiStatus();
  if (!scenario)
    return (
      <ScrollPage>
        <NotFound />
      </ScrollPage>
    );
  const Icon = contentIcon(scenario.icon);
  if (started)
    return (
      <RolePlay
        key={`${started.difficulty}-${started.correction}`}
        scenario={scenario}
        {...started}
        onRestart={() => setStarted(null)}
      />
    );
  const name = partnerName(scenario);
  return (
    <ScrollPage>
      <Link
        to="/conversation"
        className="inline-flex items-center gap-1.5 rounded-full py-1 pe-2 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
        {" All scenarios"}
      </Link>
      <header className="mt-5 flex items-start gap-4">
        <span
          className="bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white"
          aria-hidden
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">
            {scenario.title}
          </h1>
          <p className="mt-1 text-muted">{scenario.setting}</p>
          <Badge tone="primary" className="mt-2">
            {"From "}
            {LEVEL_LABELS[scenario.minLevel].code}
          </Badge>
        </div>
      </header>
      <div className="card mt-6 p-5">
        <div className="flex items-start gap-3">
          <TutorMark className="size-9" />
          <p className="min-w-0">
            <strong>{name ?? "Your partner"}</strong>
            <span className="text-muted">
              {" · "}
              {name
                ? scenario.aiRole.slice(name.length + 1).trim()
                : scenario.aiRole}
            </span>
            <br />
            <span className="text-muted">You are </span>
            {scenario.learnerRole}
            {"."}
          </p>
        </div>
        <h2 className="mt-5 text-sm font-semibold">Goals</h2>
        <ul className="mt-2 space-y-1.5">
          {scenario.objectives.map((goal) => (
            <li key={goal} className="flex gap-2">
              <CircleCheck
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {goal}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <p className="mb-2 font-semibold" id="difficulty">
            Difficulty
          </p>
          <Segmented
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            className="w-full"
            options={[
              { value: "easy", label: "Easy" },
              { value: "standard", label: "Standard" },
              { value: "challenging", label: "Challenging" },
            ]}
          />
        </div>
        <fieldset>
          <legend className="mb-2 font-semibold">Corrections</legend>
          <div
            className="grid gap-2"
            role="radiogroup"
            aria-label="Corrections"
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
                selected={correction === mode}
                onClick={() => setCorrection(mode)}
                title={title}
                description={description}
              />
            ))}
          </div>
        </fieldset>
        {status && !status.available && (
          <Notice tone="warning">
            The AI partner is not available right now. Try a lesson in the
            meantime.
          </Notice>
        )}
        <Button
          size="lg"
          className="w-full"
          icon={Sparkles}
          disabled={status?.available === false}
          onClick={() => setStarted({ difficulty, correction })}
        >
          Start conversation
        </Button>
      </div>
    </ScrollPage>
  );
}

type Assist =
  | { kind: "error"; text: string }
  | {
      kind: "replies" | "translate" | "explain";
      list?: string[];
      text?: string;
    };

function RolePlay({
  scenario,
  difficulty,
  correction,
  onRestart,
}: {
  scenario: Scenario;
  difficulty: Difficulty;
  correction: CorrectionMode;
  onRestart: () => void;
}) {
  const t = useTranslate();
  const profile = useAiProfile();
  const { prefs } = usePreferences();
  const online = useOnline();
  const activeTime = useActiveTime();
  const [draft, setDraft] = useState("");
  const [focusSignal, setFocusSignal] = useState(0);
  const [panel, setPanel] = useState<"vocab" | "starters" | null>(null);
  const [assist, setAssist] = useState<Assist | null>(null);
  const [thinking, setThinking] = useState(false);
  const [report, setReport] = useState<ConversationReport | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const id = useRef(newId("conv_"));
  const startedAt = useRef(new Date().toISOString());
  const scroller = useRef<HTMLDivElement>(null);
  const recorder = useRecorder();
  const name = partnerName(scenario);

  // Spoken replies are appended to the draft.
  useEffect(() => {
    if (recorder.state === "done" && recorder.transcript) {
      setDraft((current) =>
        current ? `${current} ${recorder.transcript}` : recorder.transcript,
      );
      recorder.reset();
    }
  }, [recorder]);
  useEffect(() => () => stopSpeaking(), []);

  const opening: ChatMessage = {
    role: "assistant",
    content: scenario.opening,
    at: startedAt.current,
  };
  const save = (messages: ChatMessage[], result?: ConversationReport) => {
    if (!prefs.saveConversations) return;
    void saveConversation({
      id: id.current,
      kind: "scenario",
      scenarioId: scenario.id,
      title: scenario.title,
      messages,
      createdAt: startedAt.current,
      updatedAt: new Date().toISOString(),
      report: result,
    });
  };
  const chat = useChat(
    "/api/ai/conversation",
    (messages) => ({
      profile,
      scenarioId: scenario.id,
      difficulty,
      correctionMode: correction,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
    [opening],
    (messages) => save(messages),
  );
  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat.messages.length, chat.streaming, assist, panel]);

  const turns = chat.messages.filter((m) => m.role === "user").length;
  const send = (text = draft) => {
    const trimmed = text.trim();
    if (!trimmed || chat.busy || trimmed.length > LIMITS.messageChars) return;
    setAssist(null);
    chat.send(trimmed);
    setDraft("");
  };
  const fillDraft = (text: string) => {
    setDraft(text);
    setFocusSignal((n) => n + 1);
  };
  const help = async (kind: "replies" | "translate" | "explain") => {
    setThinking(true);
    setAssist(null);
    setPanel(null);
    try {
      const reply = await postJson<{ suggestions?: string[]; text?: string }>(
        "/api/ai/assist",
        {
          profile,
          scenarioId: scenario.id,
          kind,
          messages: chat.messages.map(({ role, content }) => ({
            role,
            content,
          })),
        },
      );
      setAssist({ kind, list: reply.suggestions, text: reply.text });
    } catch (err) {
      setAssist({ kind: "error", text: aiErrorMessage(err) });
    } finally {
      setThinking(false);
    }
  };
  const finish = async () => {
    setReporting(true);
    setReportError(null);
    try {
      const raw = await postJson("/api/ai/report", {
        profile,
        scenarioId: scenario.id,
        messages: chat.messages.map(({ role, content }) => ({ role, content })),
      });
      const parsed = conversationReportSchema.safeParse(raw);
      if (!parsed.success) throw Error("invalid");
      setReport(parsed.data);
      save(chat.messages, parsed.data);
      await logActivity({
        type: "conversation",
        title: scenario.title,
        refId: scenario.id,
        durationSec: Math.min(activeTime.take(), 3600),
        xp: 15,
      });
    } catch (err) {
      setReportError(
        err instanceof Error && err.message === "invalid"
          ? "The report could not be checked. Please try again."
          : aiErrorMessage(err),
      );
    } finally {
      setReporting(false);
    }
  };
  const listen = async (index: number, text: string) => {
    if (speaking === index) {
      stopSpeaking();
      setSpeaking(null);
      return;
    }
    setSpeaking(index);
    try {
      await speak(speakableReply(text), {
        variety: prefs.variety,
        rate: prefs.speechRate,
        voiceURI: prefs.voiceURI,
      });
    } catch {
      // Playback failed; nothing to show.
    } finally {
      setSpeaking((current) => (current === index ? null : current));
    }
  };

  if (report)
    return (
      <ReportView scenario={scenario} report={report} onRestart={onRestart} />
    );
  const helpBlocked = thinking || chat.busy || !online;
  const correctionLabel = t(
    correction === "immediate"
      ? "settings.correctAll"
      : correction === "major"
        ? "settings.correctMajor"
        : "settings.correctNone",
  );
  const listening = recorder.state === "listening";

  return (
    <section className="flex h-full flex-col" aria-labelledby="conv-title">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 px-2 py-2 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onRestart}
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
            aria-label="Back to scenario"
          >
            <ArrowLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
          <div className="min-w-0">
            <h1
              id="conv-title"
              className="truncate leading-tight font-semibold"
            >
              {scenario.title}
            </h1>
            <p className="truncate text-xs text-muted">
              <span className="capitalize">{difficulty}</span>
              {" · "}
              {correctionLabel}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={ClipboardList}
          disabled={turns < 1 || chat.busy || reporting || !online}
          onClick={() => void finish()}
        >
          {reporting ? "Writing report…" : "Finish & get feedback"}
        </Button>
      </header>
      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto"
        aria-busy={chat.busy}
      >
        <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-4 pb-6 sm:px-6">
          {chat.messages.map((message, i) =>
            message.role === "user" ? (
              <LearnerBubble key={i}>{message.content}</LearnerBubble>
            ) : (
              <TutorMessage
                key={i}
                name={name}
                actions={
                  speechSupported() ? (
                    <ChatAction
                      icon={Volume2}
                      label={t("chat.listen")}
                      active={speaking === i}
                      onClick={() => void listen(i, message.content)}
                    />
                  ) : undefined
                }
              >
                <Markdown text={message.content} />
              </TutorMessage>
            ),
          )}
          {chat.streaming !== null && (
            <TutorMessage name={name}>
              {chat.streaming ? (
                <Markdown text={chat.streaming} />
              ) : (
                <TypingIndicator />
              )}
            </TutorMessage>
          )}
          {chat.error && (
            <Notice
              tone="danger"
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={RefreshCw}
                  onClick={chat.retry}
                >
                  {t("common.retry")}
                </Button>
              }
            >
              {chat.error}
            </Notice>
          )}
          {reportError && <Notice tone="danger">{reportError}</Notice>}
          {thinking && (
            <p
              className="flex items-center gap-2 text-sm text-muted"
              role="status"
            >
              <Sparkles className="size-4 animate-pulse" aria-hidden />
              {" Thinking…"}
            </p>
          )}
          {assist && (
            <div
              className="animate-fade-up rounded-3xl bg-indigo-soft p-4 text-sm"
              role="status"
            >
              {assist.kind === "error" ? (
                <p>{assist.text}</p>
              ) : assist.list ? (
                <>
                  <p className="mb-2.5 font-medium">You could say:</p>
                  <div className="flex flex-col gap-2">
                    {assist.list.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => fillDraft(suggestion)}
                        lang="en"
                        className="rounded-2xl bg-surface px-4 py-2.5 text-start transition-colors hover:bg-surface-2"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p
                  className="whitespace-pre-wrap"
                  lang={
                    assist.kind === "translate"
                      ? prefs.explanationLanguage
                      : undefined
                  }
                >
                  {assist.text}
                </p>
              )}
            </div>
          )}
          {panel && (
            <div className="animate-fade-up rounded-3xl bg-surface-2 p-4 text-sm">
              {panel === "vocab" ? (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {scenario.vocabulary.map((item) => (
                    <li key={item.word}>
                      <strong lang="en">{item.word}</strong>{" "}
                      <span className="text-muted">
                        {"— "}
                        {item.meaning}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {scenario.starters.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      lang="en"
                      onClick={() =>
                        fillDraft(starter.replace("…", "").trimEnd() + " ")
                      }
                      className="rounded-full bg-surface px-3.5 py-1.5 transition-colors hover:bg-surface-3"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 px-4 pb-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div
            className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1"
            role="group"
            aria-label="Help"
          >
            <HelpChip
              icon={MessageSquareQuote}
              disabled={helpBlocked}
              onClick={() => void help("replies")}
            >
              Suggest replies
            </HelpChip>
            <HelpChip
              icon={BookOpen}
              active={panel === "vocab"}
              onClick={() => setPanel(panel === "vocab" ? null : "vocab")}
            >
              Vocabulary
            </HelpChip>
            <HelpChip
              icon={Lightbulb}
              active={panel === "starters"}
              onClick={() => setPanel(panel === "starters" ? null : "starters")}
            >
              Sentence starters
            </HelpChip>
            {prefs.explanationLanguage !== "en" && (
              <HelpChip
                icon={Languages}
                disabled={helpBlocked}
                onClick={() => void help("translate")}
              >
                Translate
              </HelpChip>
            )}
            <HelpChip
              icon={Sparkles}
              disabled={helpBlocked}
              onClick={() => void help("explain")}
            >
              Explain
            </HelpChip>
          </div>
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => send()}
            onStop={chat.stop}
            busy={chat.busy}
            disabled={!online}
            label="Your reply"
            placeholder={online ? "Write your reply…" : t("chat.offlineTitle")}
            maxLength={LIMITS.messageChars}
            focusSignal={focusSignal}
            autoFocus
            inputLang="en"
            leading={
              recorder.supported && !chat.busy ? (
                <button
                  type="button"
                  onClick={listening ? recorder.stop : recorder.start}
                  aria-label={listening ? "Stop listening" : "Speak your reply"}
                  title={listening ? "Stop listening" : "Speak your reply"}
                  className={classes(
                    "grid size-10 place-items-center rounded-full transition-colors",
                    listening
                      ? "animate-pulse-ring bg-danger text-white dark:text-[#2a0d0a]"
                      : "text-muted hover:bg-surface-2 hover:text-text",
                  )}
                >
                  {listening ? (
                    <Square className="size-4 fill-current" aria-hidden />
                  ) : (
                    <Mic className="size-5" aria-hidden />
                  )}
                </button>
              ) : undefined
            }
          />
          {(listening || recorder.error) && (
            <p className="mt-2 px-2 text-sm text-danger" role="status">
              {listening
                ? `● Listening… ${recorder.transcript}`
                : recorder.error}
            </p>
          )}
          {recorder.consent}
        </div>
      </div>
    </section>
  );
}

function HelpChip({
  icon: Icon,
  children,
  onClick,
  disabled,
  active,
}: {
  icon: LucideIcon;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={classes(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors disabled:opacity-45",
        active
          ? "border-primary bg-primary-soft text-primary-text"
          : "border-border bg-surface hover:bg-surface-2",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </button>
  );
}

function ReportView({
  scenario,
  report,
  onRestart,
}: {
  scenario: Scenario;
  report: ConversationReport;
  onRestart: () => void;
}) {
  return (
    <ScrollPage>
      <header className="flex items-start gap-4">
        <TutorMark className="size-12" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary-text">
            Conversation report
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {scenario.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Written by AI from your messages. It may miss things or make
            mistakes.
          </p>
        </div>
      </header>
      <div className="mt-6 space-y-4">
        {report.successes.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-success">What went well</h2>
            <ul className="mt-2 list-disc space-y-1 ps-5">
              {report.successes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="card p-5">
          <h2 className="font-semibold">Corrections</h2>
          {report.corrections.length === 0 ? (
            <p className="mt-2 text-muted">
              No important mistakes found. Well done!
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {report.corrections.map((item, i) => (
                <li key={i} className="rounded-2xl bg-surface-2 p-4">
                  <p
                    className="text-muted line-through decoration-danger/60"
                    lang="en"
                  >
                    {item.original}
                  </p>
                  <p className="font-medium" lang="en">
                    {item.corrected}
                  </p>
                  <p className="mt-1 text-sm text-muted">{item.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {report.alternatives.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold">More natural ways to say it</h2>
            <ul className="mt-3 space-y-2" lang="en">
              {report.alternatives.map((item, i) => (
                <li key={i}>
                  <span className="text-muted">{item.original}</span>
                  {" → "}
                  <strong>{item.natural}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.vocabulary.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold">Useful vocabulary</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {report.vocabulary.map((item) => (
                <li
                  key={item.word}
                  className="rounded-2xl bg-surface-2 px-4 py-2.5"
                >
                  <strong lang="en">{item.word}</strong>
                  {" — "}
                  {item.meaning}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.nextSteps.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold">Practise next</h2>
            <ul className="mt-2 list-disc space-y-1 ps-5">
              {report.nextSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onRestart} icon={RefreshCw}>
            Practise again
          </Button>
          <ButtonLink to="/conversation" variant="secondary">
            Other scenarios
          </ButtonLink>
        </div>
      </div>
    </ScrollPage>
  );
}
