import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Check, Copy, RefreshCw, Trash, Volume2 } from "lucide-react";
import { LIMITS } from "../../../shared/constants";
import { tutorPrompts } from "../data/catalogues";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import { Badge, Button, Dialog, Notice } from "../components/ui";
import {
  ChatAction,
  LearnerBubble,
  TutorMark,
  TutorMessage,
  TypingIndicator,
} from "../components/ChatMessages";
import { Composer } from "../components/Composer";
import { Markdown } from "../components/Markdown";
import { usePageMeta } from "../lib/use-page-meta";
import { useAiStatus } from "../lib/use-ai-status";
import { useAiProfile } from "../lib/use-ai-profile";
import { useOnline } from "../lib/use-online";
import { useActiveTime } from "../lib/use-active-time";
import { useStoredValue } from "../lib/use-stored-value";
import { useChat } from "../lib/use-chat";
import { logActivity, newId } from "../lib/activity";
import {
  deleteConversation,
  listConversations,
  saveConversation,
  type Conversation,
} from "../lib/conversations";
import { learnerDb } from "../lib/database";
import { learnerDatabase } from "../lib/storage-keys";
import { findLesson } from "../lib/course";
import { mistakeNotes } from "../lib/progress-stats";
import { speak, speechSupported, stopSpeaking } from "../lib/speech";
import { readVocab } from "../lib/vocab";

const { stores } = learnerDatabase;

/** Markdown reduced to plain text, for speech and the screen-reader announcement. */
function plainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`#>|~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const readTutorChats = () => listConversations("tutor");

/**
 * Routes: `?c=<id>` opens a saved chat, `?new=<key>` starts a fresh one, `?q=` prefills
 * the composer and `?send=1` sends it straight away.
 */
export function TutorPage() {
  const t = useTranslate();
  usePageMeta({ title: t("nav.tutor"), noindex: true });
  const status = useAiStatus();
  const [params, setParams] = useSearchParams();
  const chatId = params.get("c");
  const fresh = params.get("new");
  const chats = useStoredValue(stores.conversations, readTutorChats, undefined);
  const justCreated = useRef<string | null>(null);
  const [current, setCurrent] = useState(() => ({
    key: chatId ?? fresh ?? "default",
    id: chatId,
  }));
  useEffect(() => {
    // A chat this page just created keeps its key, so the view is not remounted.
    if (chatId && chatId === justCreated.current) {
      justCreated.current = null;
      return;
    }
    const next = chatId
      ? { key: chatId, id: chatId }
      : { key: fresh ?? "default", id: null };
    setCurrent((prev) =>
      prev.key === next.key && prev.id === next.id ? prev : next,
    );
  }, [chatId, fresh]);
  const autoSend = params.get("send") === "1" ? params.get("q") : null;
  const prefill = params.get("send") === "1" ? "" : (params.get("q") ?? "");
  if (current.id && !chats)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="space-y-3" role="status" aria-label={t("app.loading")}>
          <div
            className="animate-pulse rounded-2xl bg-surface-2 h-9 w-1/2"
            aria-hidden
          />
          <div
            className="animate-pulse rounded-2xl bg-surface-2 h-28 w-full"
            aria-hidden
          />
          <div
            className="animate-pulse rounded-2xl bg-surface-2 h-28 w-full"
            aria-hidden
          />
        </div>
      </div>
    );
  const conversation = current.id
    ? (chats?.find((c) => c.id === current.id) ?? null)
    : null;
  return (
    <TutorChat
      key={current.key}
      conversation={conversation}
      aiAvailable={status?.available}
      prefill={prefill}
      autoSend={autoSend}
      onCreated={(id) => {
        justCreated.current = id;
        setParams({ c: id }, { replace: true });
      }}
      onConsumed={() =>
        setParams(fresh ? { new: fresh } : {}, { replace: true })
      }
      onDeleted={() => setParams({ new: Date.now().toString(36) })}
    />
  );
}

/** Tutor context; like the original, any read problem just leaves it out. */
async function readTutorContext() {
  try {
    return await buildTutorContext();
  } catch {
    return undefined;
  }
}
async function buildTutorContext() {
  const db = await learnerDb();
  const [lessons, results, vocab] = await Promise.all([
    db?.getAll(stores.lessons) ?? [],
    db?.getAll(stores.results) ?? [],
    readVocab(),
  ]);
  const latest = (lessons as { lessonId: string; updatedAt: string }[]).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  )[0];
  return {
    currentLesson: latest ? findLesson(latest.lessonId)?.title : undefined,
    recentMistakes: mistakeNotes(
      (
        results as {
          at: string;
          correct: boolean;
          given?: string;
          expected?: string;
        }[]
      ).sort((a, b) => b.at.localeCompare(a.at)),
      LIMITS.recentMistakes,
    ),
    knownWords: vocab
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, 15)
      .map((word) => word.word),
  };
}
const contextStores = [stores.lessons, stores.results, stores.vocab] as const;

function TutorChat({
  conversation,
  aiAvailable,
  prefill,
  autoSend,
  onCreated,
  onConsumed,
  onDeleted,
}: {
  conversation: Conversation | null;
  aiAvailable: boolean | undefined;
  prefill: string;
  autoSend: string | null;
  onCreated: (id: string) => void;
  onConsumed: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslate();
  const { prefs } = usePreferences();
  const profile = useAiProfile();
  const online = useOnline();
  const [draft, setDraft] = useState(() =>
    prefill.slice(0, LIMITS.messageChars),
  );
  const [savedId, setSavedId] = useState(conversation?.id ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const idRef = useRef(conversation?.id ?? null);
  const createdAt = useRef(conversation?.createdAt ?? new Date().toISOString());
  const scroller = useRef<HTMLDivElement>(null);
  const followBottom = useRef(true);
  const activeTime = useActiveTime();
  const talked = useRef(false);
  const context = useStoredValue(contextStores, readTutorContext, undefined);

  const chat = useChat(
    "/api/ai/tutor",
    (messages) => ({
      profile,
      messages: messages.map(({ role, content }) => ({ role, content })),
      context: { ...context, correctionMode: prefs.correctionMode },
    }),
    conversation?.messages ?? [],
    (messages) => {
      talked.current = true;
      const last = messages.at(-1);
      if (last?.role === "assistant")
        setAnnouncement(plainText(last.content).slice(0, 600));
      if (!prefs.saveConversations) return;
      if (!idRef.current) {
        idRef.current = newId("tutor_");
        setSavedId(idRef.current);
        onCreated(idRef.current);
      }
      const firstQuestion =
        messages.find((m) => m.role === "user")?.content ?? "Conversation";
      void saveConversation({
        id: idRef.current,
        kind: "tutor",
        title: firstQuestion.slice(0, 60),
        messages,
        createdAt: createdAt.current,
        updatedAt: new Date().toISOString(),
      });
    },
  );

  // Dashboard handoff (?q=…&send=1): send once, then clear the query when not saving.
  useEffect(() => {
    if (!autoSend?.trim()) return;
    const timer = setTimeout(() => {
      chat.send(autoSend.trim().slice(0, LIMITS.messageChars));
      if (!prefs.saveConversations) onConsumed();
    }, 0);
    return () => clearTimeout(timer);
    // Runs once for the chat it was mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(
    () => () => {
      stopSpeaking();
      if (talked.current)
        void logActivity({
          type: "tutor",
          title: "AI tutor session",
          durationSec: Math.min(activeTime.take(), 3600),
          xp: 5,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    const box = scroller.current;
    if (box && followBottom.current)
      box.scrollTo({
        top: box.scrollHeight,
        behavior: chat.streaming ? "auto" : "smooth",
      });
  }, [chat.messages.length, chat.streaming]);

  const submit = (text = draft) => {
    const trimmed = text.trim();
    if (!trimmed || chat.busy || trimmed.length > LIMITS.messageChars) return;
    followBottom.current = true;
    chat.send(trimmed);
    setDraft("");
  };
  const prompts = useMemo(
    () =>
      tutorPrompts[
        ["pre-a1", "a1"].includes(prefs.level) ? "beginner" : "other"
      ],
    [prefs.level],
  );
  const unavailable = aiAvailable === false || !online;
  const lastReply = chat.messages.map((m) => m.role).lastIndexOf("assistant");
  const empty = chat.messages.length === 0 && chat.streaming === null;
  const copy = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked.
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
      await speak(plainText(text), {
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

  return (
    <section className="flex h-full flex-col" aria-labelledby="tutor-title">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <h1
            id="tutor-title"
            className="truncate text-[1.05rem] font-semibold"
          >
            {t("nav.tutor")}
          </h1>
          {!prefs.saveConversations && <Badge>Not saved</Badge>}
        </div>
        {savedId && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash}
            aria-label={t("chat.delete")}
            title={t("chat.delete")}
            onClick={() => setConfirmDelete(true)}
          />
        )}
      </header>
      <div
        ref={scroller}
        onScroll={(event) => {
          const box = event.currentTarget;
          followBottom.current =
            box.scrollHeight - box.scrollTop - box.clientHeight < 96;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
        aria-busy={chat.busy}
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pt-2 pb-6 sm:px-6">
          {unavailable && (
            <div className="mb-4">
              <Notice
                tone="warning"
                title={t(
                  online ? "chat.unavailableTitle" : "chat.offlineTitle",
                )}
              >
                {t(online ? "error.aiUnavailable" : "error.offlineAi")}
              </Notice>
            </div>
          )}
          {empty ? (
            <div className="animate-fade-up flex flex-1 flex-col items-center justify-center py-8 text-center">
              <TutorMark className="size-14" />
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                <span className="text-gradient">{t("chat.emptyTitle")}</span>
              </h2>
              <p className="mt-2 max-w-md text-muted">
                {t("chat.emptySubtitle")}
              </p>
              <div className="mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.title}
                    type="button"
                    disabled={unavailable}
                    onClick={() => submit(prompt.title)}
                    lang="en"
                    className="rounded-2xl border border-border bg-surface p-4 text-start transition-colors hover:border-border-strong hover:bg-surface-2 disabled:opacity-50"
                  >
                    <span className="block text-sm font-medium">
                      {prompt.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {prompt.body}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {chat.messages.map((message, i) =>
                message.role === "user" ? (
                  <LearnerBubble key={i}>{message.content}</LearnerBubble>
                ) : (
                  <TutorMessage
                    key={i}
                    actions={
                      <>
                        <ChatAction
                          icon={copied === i ? Check : Copy}
                          label={t(copied === i ? "chat.copied" : "chat.copy")}
                          active={copied === i}
                          onClick={() => void copy(i, message.content)}
                        />
                        {speechSupported() && (
                          <ChatAction
                            icon={Volume2}
                            label={t("chat.listen")}
                            active={speaking === i}
                            onClick={() => void listen(i, message.content)}
                          />
                        )}
                        {i === lastReply && !chat.busy && (
                          <ChatAction
                            icon={RefreshCw}
                            label={t("chat.regenerate")}
                            onClick={chat.regenerate}
                          />
                        )}
                      </>
                    }
                  >
                    <Markdown text={message.content} />
                  </TutorMessage>
                ),
              )}
              {chat.streaming !== null && (
                <TutorMessage>
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
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 px-4 pb-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => submit()}
            onStop={chat.stop}
            busy={chat.busy}
            disabled={unavailable}
            label={t("chat.message")}
            placeholder={t("home.placeholder")}
            maxLength={LIMITS.messageChars}
            autoFocus
            inputLang="en"
          />
          <p className="mt-2 text-center text-xs text-muted">
            {t("chat.disclaimer")}
          </p>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this chat?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (savedId) await deleteConversation(savedId);
                setConfirmDelete(false);
                onDeleted();
              }}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        It will be removed from this device.
      </Dialog>
    </section>
  );
}
