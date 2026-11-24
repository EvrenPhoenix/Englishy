import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, RotateCcw, Sparkles, X } from "lucide-react";
import {
  LIMITS,
  WRITING_MODES,
  type WritingMode,
} from "../../../shared/constants";
import {
  writingFeedbackSchema,
  type FeedbackCategory,
  type WritingFeedback,
} from "../../../shared/schemas";
import { writingModes } from "../data/catalogues";
import { useTranslate } from "../i18n/provider";
import {
  Badge,
  PageHeader,
  classes,
  Button,
  Notice,
  SwitchRow,
} from "../components/ui";
import { usePageMeta } from "../lib/use-page-meta";
import { useAiProfile } from "../lib/use-ai-profile";
import { useAiStatus } from "../lib/use-ai-status";
import { useOnline } from "../lib/use-online";
import { useActiveTime } from "../lib/use-active-time";
import { logActivity } from "../lib/activity";
import { aiErrorMessage, postJson } from "../lib/ai";
import { storageKeys } from "../lib/storage-keys";
import {
  applyAccepted,
  countWords,
  segmentText,
} from "../lib/writing-feedback";

const highlight: Record<FeedbackCategory, string> = {
  grammar: "bg-danger-soft decoration-danger",
  spelling: "bg-danger-soft decoration-danger",
  punctuation: "bg-warning-soft decoration-warning",
  phrasing: "bg-indigo-soft decoration-indigo",
  vocabulary: "bg-indigo-soft decoration-indigo",
  tone: "bg-accent-soft decoration-accent",
  clarity: "bg-accent-soft decoration-accent",
  structure: "bg-accent-soft decoration-accent",
  style: "bg-surface-3 decoration-border-strong",
};

function readDraft() {
  try {
    return localStorage.getItem(storageKeys.writingDraft) ?? "";
  } catch {
    return "";
  }
}

export function WritingPage() {
  const t = useTranslate();
  usePageMeta({
    title: "English writing practice",
    description:
      "Get clear feedback on your English writing that separates real mistakes from optional style improvements.",
    path: "/writing",
  });
  const profile = useAiProfile();
  const online = useOnline();
  const status = useAiStatus();
  const activeTime = useActiveTime();
  const [mode, setMode] = useState<WritingMode>("everyday");
  const [task, setTask] = useState("");
  const [text, setText] = useState(readDraft);
  const [wantImproved, setWantImproved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{
    text: string;
    data: WritingFeedback;
  } | null>(null);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [focused, setFocused] = useState<number | null>(null);
  const [showOptional, setShowOptional] = useState(true);
  const [copied, setCopied] = useState<"corrected" | "improved" | null>(null);
  const request = useRef<AbortController | null>(null);

  // The draft survives reloads on this device.
  useEffect(() => {
    try {
      localStorage.setItem(storageKeys.writingDraft, text);
    } catch {
      // Storage blocked: the draft lives only in memory.
    }
  }, [text]);
  useEffect(() => () => request.current?.abort(), []);

  const words = countWords(text);
  const tooLong = text.length > LIMITS.writingChars;
  const check = async () => {
    setChecking(true);
    setError(null);
    request.current = new AbortController();
    try {
      const raw = await postJson(
        "/api/ai/writing",
        {
          profile,
          mode,
          text,
          includeImproved: wantImproved,
          prompt: task.trim() || undefined,
        },
        request.current.signal,
      );
      const parsed = writingFeedbackSchema.safeParse(raw);
      if (!parsed.success) throw Error("invalid");
      setReview({ text, data: parsed.data });
      // Real errors start accepted; optional suggestions are opt-in.
      setAccepted(
        new Set(
          parsed.data.issues
            .map((issue, i) => (issue.optional ? -1 : i))
            .filter((i) => i >= 0),
        ),
      );
      setFocused(null);
      await logActivity({
        type: "writing",
        title: `Writing: ${writingModes[mode].label}`,
        durationSec: Math.min(activeTime.take(), 3600),
        xp: 10,
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message === "invalid"
          ? "The feedback could not be checked. Please try again."
          : aiErrorMessage(err),
      );
    } finally {
      setChecking(false);
    }
  };

  const issues = useMemo(() => review?.data.issues ?? [], [review]);
  const visible = useMemo(
    () =>
      new Set(
        issues
          .map((issue, i) => (showOptional || !issue.optional ? i : -1))
          .filter((i) => i >= 0),
      ),
    [issues, showOptional],
  );
  const corrected = review ? applyAccepted(review.text, issues, accepted) : "";
  const segments = review ? segmentText(review.text, issues) : [];
  const copy = async (which: "corrected" | "improved", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked: nothing to show.
    }
  };
  const toggle = (index: number) => {
    const next = new Set(accepted);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setAccepted(next);
  };
  const errorCount = issues.filter((issue) => !issue.optional).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("nav.writing")}
        subtitle="Write or paste your text. Feedback separates real mistakes from optional improvements and keeps your meaning."
      />
      {review ? (
        <>
          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Feedback</h2>
                <p className="mt-1">{review.data.summary}</p>
              </div>
              <div className="flex gap-2">
                <Badge tone={errorCount ? "danger" : "success"}>
                  {errorCount}
                  {" error"}
                  {errorCount === 1 ? "" : "s"}
                </Badge>
                <Badge tone="indigo">
                  {issues.length - errorCount}
                  {" optional"}
                </Badge>
              </div>
            </div>
            {review.data.strengths.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {review.data.strengths.map((strength) => (
                  <li key={strength} className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                    {strength}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              AI feedback can be wrong. If a suggestion changes your meaning,
              reject it.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="card p-5 lg:col-span-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Your text</h2>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOptional}
                    onChange={(event) => setShowOptional(event.target.checked)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  Show optional suggestions
                </label>
              </div>
              <p className="whitespace-pre-wrap leading-loose" lang="en">
                {segments.map((segment, i) =>
                  segment.issue === undefined || !visible.has(segment.issue) ? (
                    <span key={i}>{segment.text}</span>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFocused(segment.issue!)}
                      aria-label={`${issues[segment.issue].optional ? "Suggestion" : "Error"}: ${segment.text}`}
                      className={classes(
                        "rounded px-0.5 underline decoration-2 underline-offset-4",
                        highlight[issues[segment.issue].category],
                        issues[segment.issue].optional && "decoration-dotted",
                        focused === segment.issue && "ring-2 ring-primary",
                        accepted.has(segment.issue) && "opacity-70",
                      )}
                    >
                      {segment.text}
                    </button>
                  ),
                )}
              </p>
              <p className="mt-4 text-xs text-muted">
                Solid underline = error. Dotted underline = optional
                improvement. Select a highlight to see the explanation.
              </p>
            </div>
            <div className="space-y-3 lg:col-span-2">
              {issues.length === 0 && (
                <Notice tone="success">No mistakes found. Great work!</Notice>
              )}
              <ul className="space-y-2">
                {issues.map((issue, i) =>
                  visible.has(i) ? (
                    <li
                      key={i}
                      className={classes(
                        "card p-3 text-sm",
                        focused === i && "ring-2 ring-primary",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={issue.optional ? "indigo" : "danger"}>
                          {issue.optional ? "Optional" : "Error"}
                        </Badge>
                        <Badge className="capitalize">{issue.category}</Badge>
                      </div>
                      <p className="mt-2">
                        <span className="line-through decoration-danger/60">
                          {issue.original}
                        </span>
                        {" → "}
                        <strong>{issue.suggestion || "(remove)"}</strong>
                      </p>
                      <p className="mt-1 text-muted">{issue.explanation}</p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant={accepted.has(i) ? "soft" : "secondary"}
                          icon={accepted.has(i) ? Check : undefined}
                          onClick={() => toggle(i)}
                          aria-pressed={accepted.has(i)}
                        >
                          {accepted.has(i) ? "Accepted" : "Accept"}
                        </Button>
                        {accepted.has(i) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={X}
                            onClick={() => toggle(i)}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                Corrected text (with accepted suggestions)
              </h2>
              <Button
                size="sm"
                variant="secondary"
                icon={copied === "corrected" ? Check : Copy}
                onClick={() => void copy("corrected", corrected)}
              >
                {copied === "corrected" ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed" lang="en">
              {corrected}
            </p>
          </div>
          {review.data.improved && (
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Improved version</h2>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={copied === "improved" ? Check : Copy}
                  onClick={() => void copy("improved", review.data.improved!)}
                >
                  {copied === "improved" ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed" lang="en">
                {review.data.improved}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              icon={RotateCcw}
              onClick={() => {
                setText(corrected);
                setReview(null);
              }}
            >
              Edit and check again
            </Button>
            <Button variant="secondary" onClick={() => setReview(null)}>
              Back to my original
            </Button>
          </div>
        </>
      ) : (
        <div className="card space-y-4 p-5 sm:p-6">
          <fieldset>
            <legend className="font-medium">Type of writing</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WRITING_MODES.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  onClick={() => setMode(id)}
                  className={classes(
                    "rounded-xl border-2 px-3 py-2 text-start",
                    mode === id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <span className="block text-sm font-semibold">
                    {writingModes[id].label}
                  </span>
                  <span className="block text-xs text-muted">
                    {writingModes[id].hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="font-medium">Task or question (optional)</span>
            <input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              maxLength={300}
              placeholder="e.g. Write an email to your manager asking for a day off."
              className="mt-1 h-11 w-full rounded-xl border border-border-strong bg-surface px-3"
            />
          </label>
          <label className="block">
            <span className="font-medium">Your text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={10}
              lang="en"
              placeholder="Start writing here…"
              className="mt-1 w-full rounded-xl border-2 border-border-strong bg-surface p-4 text-[1.02rem] leading-relaxed focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <span>
              {words}
              {" words · "}
              <span className={tooLong ? "font-semibold text-danger" : ""}>
                {text.length}
                {"/"}
                {LIMITS.writingChars}
                {" characters"}
              </span>
            </span>
            <span>Your draft is kept on this device until you clear it.</span>
          </div>
          <SwitchRow
            label="Also suggest an improved version"
            description="A more natural rewrite that keeps your meaning."
            checked={wantImproved}
            onChange={setWantImproved}
          />
          {(status?.available === false || !online) && (
            <Notice tone="warning">
              {t(online ? "error.aiUnavailable" : "error.offlineAi")}
            </Notice>
          )}
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button
              icon={Sparkles}
              disabled={
                checking ||
                text.trim().length < 3 ||
                tooLong ||
                !online ||
                status?.available === false
              }
              onClick={() => void check()}
            >
              {checking ? "Checking your writing…" : "Get feedback"}
            </Button>
            {checking && (
              <Button variant="ghost" onClick={() => request.current?.abort()}>
                {t("common.cancel")}
              </Button>
            )}
            {text && !checking && (
              <Button variant="ghost" onClick={() => setText("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
