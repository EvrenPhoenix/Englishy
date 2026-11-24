import type { Lesson } from "../../data/types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { LEVEL_LABELS } from "../../../../shared/constants";
import { useTranslate } from "../../i18n/provider";
import { usePreferences } from "../../components/PreferencesProvider";
import { Badge, Button } from "../../components/ui";
import { RichText } from "../../components/RichText";
import { ListenButton } from "../../components/SpeechControls";
import { useAiProfile } from "../../lib/use-ai-profile";
import { aiErrorMessage, streamText } from "../../lib/ai";
import { LessonWords } from "./LessonWords";

export function LessonIntro({
  lesson,
  Icon,
  onStart,
  showNative,
}: {
  lesson: Lesson;
  Icon: LucideIcon;
  onStart: () => void;
  showNative: boolean;
}) {
  const t = useTranslate();
  const { prefs } = usePreferences();
  const profile = useAiProfile();
  const nativeTip =
    prefs.nativeLanguage !== "en" && prefs.nativeLanguage !== "other"
      ? lesson.nativeTip?.[prefs.nativeLanguage]
      : undefined;
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const explain = async () => {
    setAsking(true);
    setError(null);
    request.current = new AbortController();
    try {
      await streamText(
        "/api/ai/explain",
        {
          profile,
          topic: "lesson",
          subject: lesson.title,
          detail: lesson.explanation.join(" ").slice(0, 780),
        },
        (_chunk, sofar) => setExplanation(sofar),
        request.current.signal,
      );
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setAsking(false);
    }
  };
  const minutes = useMemo(
    () => t("common.minutes", { n: lesson.minutes }),
    [t, lesson.minutes],
  );
  return (
    <article className="animate-fade-up space-y-5">
      <header className="flex items-start gap-4">
        <span
          className="bg-brand-mark grid size-14 shrink-0 place-items-center rounded-2xl text-white"
          aria-hidden
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="primary">{LEVEL_LABELS[lesson.level].code}</Badge>
            <Badge icon={Clock}>{minutes}</Badge>
            <Badge tone="indigo">{lesson.skill}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
            {lesson.title}
          </h1>
        </div>
      </header>
      <div className="card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-muted">
          {t("lesson.objectives")}
        </h2>
        <ul className="mt-3 space-y-1.5">
          {lesson.objectives.map((objective) => (
            <li key={objective} className="flex gap-2">
              <Check
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {objective}
            </li>
          ))}
        </ul>
      </div>
      {showNative && nativeTip && (
        <div
          className="rounded-3xl bg-indigo-soft p-5"
          lang={prefs.nativeLanguage}
          dir={prefs.nativeLanguage === "ar" ? "rtl" : undefined}
        >
          <p
            className="mb-1 text-xs font-semibold text-indigo"
            lang="en"
            dir="ltr"
          >
            {t("common.translation")}
          </p>
          <p className="text-[1.05rem] leading-relaxed">{nativeTip}</p>
        </div>
      )}
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t("lesson.explanation")}</h2>
        <div className="mt-3 space-y-3 leading-relaxed">
          {lesson.explanation.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
        <div className="mt-4">
          {explanation ? (
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Sparkles className="size-3.5" aria-hidden />
                {" AI explanation · may contain mistakes"}
              </p>
              <p className="whitespace-pre-wrap text-[0.95rem]">
                {explanation}
              </p>
            </div>
          ) : (
            <Button
              variant="soft"
              size="sm"
              icon={Sparkles}
              onClick={explain}
              disabled={asking}
            >
              {asking ? "Asking the tutor…" : t("lesson.explainAi")}
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </div>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t("lesson.examples")}</h2>
        <ul className="mt-3 divide-y divide-border">
          {lesson.examples.map((example) => (
            <li
              key={example.en}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-[1.05rem] font-medium" lang="en">
                  {example.en}
                </p>
                {example.note && (
                  <p className="text-sm text-muted">{example.note}</p>
                )}
              </div>
              <ListenButton
                text={example.en}
                label={t("common.listen")}
                size="sm"
                revealFallback={false}
              />
            </li>
          ))}
        </ul>
      </div>
      {lesson.vocab && lesson.vocab.length > 0 && (
        <LessonWords ids={lesson.vocab} />
      )}
      <div className="sticky bottom-4 z-10 flex justify-center pt-2">
        <Button
          size="lg"
          onClick={onStart}
          iconEnd={ChevronRight}
          className="px-8 shadow-raised"
        >
          {t("lesson.startPractice")}
          {" · "}
          {lesson.exercises.length}
        </Button>
      </div>
    </article>
  );
}
