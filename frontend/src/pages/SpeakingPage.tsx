import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  Ear,
  Keyboard,
  MessageCircle,
  Mic,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { LEVELS } from "../../../shared/constants";
import { lessons } from "../data/lessons";
import { vocabulary } from "../data/vocabulary";
import type { Exercise } from "../data/types";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "../components/PreferencesProvider";
import { PageHeader, classes } from "../components/PageElements";
import { Notice } from "../components/Controls";
import { PracticeSession } from "../components/PracticeSession";
import { usePageMeta } from "../lib/use-page-meta";
import { recognitionSupported, speechSupported } from "../lib/speech";
import { seedFromId, seededShuffle } from "../lib/validate";

type DrillId = "words" | "complete" | "dictation" | "repeat" | "read";
const drills: {
  id: DrillId;
  tab: "listen" | "speak";
  title: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    id: "words",
    tab: "listen",
    title: "Listen and identify words",
    desc: "Hear a word and choose what you heard.",
    icon: Ear,
  },
  {
    id: "complete",
    tab: "listen",
    title: "Listen and complete",
    desc: "Hear a sentence and choose the missing word.",
    icon: AudioLines,
  },
  {
    id: "dictation",
    tab: "listen",
    title: "Dictation",
    desc: "Hear a sentence and type it.",
    icon: Keyboard,
  },
  {
    id: "repeat",
    tab: "speak",
    title: "Repeat sentences",
    desc: "Listen, then say the sentence aloud.",
    icon: Repeat,
  },
  {
    id: "read",
    tab: "speak",
    title: "Read aloud",
    desc: "Read short texts and compare with what was heard.",
    icon: BookOpen,
  },
];

/** Short, complete example sentences from lessons up to the learner's level (at least A1). */
function exampleSentences(levelIndex: number) {
  return lessons
    .filter((lesson) => LEVELS.indexOf(lesson.level) <= Math.max(levelIndex, 1))
    .flatMap((lesson) => lesson.examples.map((example) => example.en))
    .filter(
      (sentence) =>
        /^[A-Z].*[.?!]$/.test(sentence) &&
        !/[…·—]/.test(sentence) &&
        sentence.split(" ").length >= 3 &&
        sentence.split(" ").length <= 12,
    );
}

/** Builds a fresh, seeded set of questions for a drill. */
function buildDrill(
  drill: DrillId,
  levelIndex: number,
  seed: number,
): Exercise[] {
  const sentences = seededShuffle(exampleSentences(levelIndex), seed);
  const words = seededShuffle(
    vocabulary.filter(
      (entry) =>
        LEVELS.indexOf(entry.level) <= Math.max(levelIndex, 1) &&
        !entry.word.includes(" "),
    ),
    seed,
  );
  const prefix = `${drill}:${seed}`;
  switch (drill) {
    case "words":
      return words.slice(0, 8).map((entry, i) => {
        const sameTopic = vocabulary.filter(
          (other) =>
            other.id !== entry.id &&
            other.topic === entry.topic &&
            !other.word.includes(" "),
        );
        const distractors = seededShuffle(sameTopic, seed + i)
          .slice(0, 2)
          .map((other) => other.word);
        const options = seededShuffle(
          [entry.word, ...distractors],
          seed + i * 7,
        );
        return {
          id: `${prefix}:${i}`,
          type: "listen",
          audio: entry.word,
          prompt: "Which word do you hear?",
          options,
          answer: options.indexOf(entry.word),
        };
      });
    case "complete":
      return sentences.slice(0, 8).flatMap((sentence, i): Exercise[] => {
        const tokens = sentence.split(" ");
        const candidates = tokens
          .map((token, k) => ({ t: token.replace(/[.,!?]/g, ""), k }))
          .filter((c) => c.t.length >= 4 && /^[a-zA-Z]+$/.test(c.t));
        if (!candidates.length) return [];
        const gap = candidates[(seed + i) % candidates.length];
        const prompt = tokens
          .map((token, k) =>
            k === gap.k ? token.replace(gap.t, "___") : token,
          )
          .join(" ");
        const others = words
          .map((entry) => entry.word)
          .filter((word) => word.toLowerCase() !== gap.t.toLowerCase());
        const options = seededShuffle(
          [gap.t, others[i % others.length], others[(i + 3) % others.length]],
          seed + i,
        );
        return [
          {
            id: `${prefix}:${i}`,
            type: "listen",
            audio: sentence,
            prompt,
            options,
            answer: options.indexOf(gap.t),
          },
        ];
      });
    case "dictation":
      return sentences.slice(0, 6).map((sentence, i) => ({
        id: `${prefix}:${i}`,
        type: "dictation",
        audio: sentence,
        answers: [sentence],
      }));
    case "repeat":
      return sentences.slice(0, 6).map((sentence, i) => ({
        id: `${prefix}:${i}`,
        type: "speak",
        text: sentence,
      }));
    case "read": {
      const passages = lessons
        .flatMap((lesson) =>
          lesson.exercises.flatMap((exercise) =>
            exercise.type === "reading" ? [exercise.passage] : [],
          ),
        )
        .filter((passage, i, all) => all.indexOf(passage) === i)
        .map((passage) =>
          passage
            .split("\n")
            .join(" ")
            .split(/(?<=[.!?])\s+/)
            .slice(0, 2)
            .join(" "),
        );
      return seededShuffle(passages, seed)
        .slice(0, 4)
        .map((text, i) => ({
          id: `${prefix}:${i}`,
          type: "speak",
          text,
          prompt: "Read this aloud.",
        }));
    }
  }
}

export function SpeakingPage() {
  const t = useTranslate();
  usePageMeta({
    title: t("nav.speaking"),
    description:
      "Practise English listening and speaking: identify words, dictation, repeat sentences and read aloud.",
    path: "/speaking",
  });
  const { prefs } = usePreferences();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "speak" ? "speak" : "listen";
  const [active, setActive] = useState<DrillId | null>(null);
  const [round, setRound] = useState(0);
  const levelIndex = LEVELS.indexOf(prefs.level);
  const exercises = useMemo(
    () =>
      active
        ? buildDrill(
            active,
            levelIndex,
            seedFromId(`${active}-${Date.now()}-${round}`),
          )
        : [],
    [active, levelIndex, round],
  );
  const canPlay = speechSupported();
  const canRecognise = recognitionSupported();

  if (active) {
    const drill = drills.find((d) => d.id === active)!;
    return (
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />{" "}
          {t("nav.speaking")}
        </button>
        <PracticeSession
          key={round}
          exercises={exercises}
          title={drill.title}
          activityType={drill.tab === "listen" ? "listening" : "speaking"}
          refId={`drill:${active}`}
          skill={drill.tab === "listen" ? "listening" : "pronunciation"}
          onDone={() => setRound((n) => n)}
        />
        <button
          type="button"
          className="mt-4 text-sm text-primary-text hover:underline"
          onClick={() => setRound((n) => n + 1)}
        >
          New set of questions
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("nav.speaking")}
        subtitle="Optional audio practice using your browser's speech features. Every accent is welcome. Lessons never require audio."
      />
      <div
        role="tablist"
        aria-label="Skill"
        className="inline-flex gap-0.5 rounded-full bg-surface-2 p-1"
      >
        {(["listen", "speak"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() =>
              setParams(id === "speak" ? { tab: "speak" } : {}, {
                replace: true,
              })
            }
            className={classes(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-raised text-text shadow-sm ring-1 ring-border"
                : "text-muted hover:text-text",
            )}
          >
            {id === "listen" ? (
              <Ear className="size-4" aria-hidden />
            ) : (
              <Mic className="size-4" aria-hidden />
            )}
            {id === "listen" ? "Listening" : "Speaking"}
          </button>
        ))}
      </div>
      {tab === "listen" && !canPlay && (
        <Notice tone="warning">
          Your browser does not support speech playback, so the text will be
          shown instead of audio. You can still practise reading and typing.
        </Notice>
      )}
      {tab === "speak" && (
        <Notice tone="info" title="How speaking practice works">
          {canRecognise ? (
            <>
              {
                "Your browser turns your speech into text, and we compare it with the sentence. This is transcription-based feedback, not a precise pronunciation score. Some browsers (such as Chrome) send audio to the browser maker's servers for this; "
              }
              {BRAND.name}
              {
                " never records or stores audio. You will be asked before the microphone is used."
              }
            </>
          ) : (
            <>
              Speech recognition is not supported in this browser. You can still
              listen, say sentences aloud and check yourself. Chrome, Edge and
              Safari support speech recognition.
            </>
          )}
        </Notice>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drills
          .filter((drill) => drill.tab === tab)
          .map((drill) => (
            <button
              key={drill.id}
              type="button"
              onClick={() => setActive(drill.id)}
              className="card flex items-start gap-3 p-5 text-start card-hover"
            >
              <drill.icon
                className="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden
              />
              <span>
                <span className="block font-semibold">{drill.title}</span>
                <span className="text-sm text-muted">{drill.desc}</span>
              </span>
            </button>
          ))}
        {tab === "speak" && (
          <Link
            to="/conversation"
            className="card flex items-start gap-3 p-5 card-hover"
          >
            <MessageCircle
              className="mt-0.5 size-6 shrink-0 text-indigo"
              aria-hidden
            />
            <span>
              <span className="block font-semibold">Spoken conversation</span>
              <span className="text-sm text-muted">
                Use the microphone button in any conversation scenario to speak
                your replies.
              </span>
            </span>
          </Link>
        )}
      </div>
      <div className="card p-5 text-sm text-muted">
        {"Tip: change the voice and speaking speed in "}
        <Link to="/settings" className="text-primary-text underline">
          Settings → Audio and speech
        </Link>
        {'. Use the "Slow" button to hear sentences more clearly.'}
      </div>
    </div>
  );
}
