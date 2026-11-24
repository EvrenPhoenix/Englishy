import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  CircleCheck,
  CircleX,
  Dumbbell,
  Info,
} from "lucide-react";
import { LEVEL_LABELS } from "../../../shared/constants";
import { grammar } from "../data/grammar";
import { Badge, Button, ButtonLink } from "../components/ui";
import { RichText } from "../components/RichText";
import { PracticeSession } from "../components/PracticeSession";
import { ListenButton } from "../components/SpeechControls";
import { usePageMeta } from "../lib/use-page-meta";
import { NotFound } from "./NotFound";

export const findGrammarTopic = (id: string) =>
  grammar.find((topic) => topic.id === id);

/** Example text without emphasis markers or bracketed notes, for speech. */
const speakable = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\(.*?\)/g, "");

export function GrammarTopicPage() {
  const { topicId = "" } = useParams();
  const topic = findGrammarTopic(topicId);
  usePageMeta({
    title: topic ? `${topic.title} · English grammar` : "Grammar",
    description: topic?.summary,
    path: `/grammar/${topicId}`,
    noindex: !topic,
  });
  const [details, setDetails] = useState(false);
  const [practising, setPractising] = useState(false);
  if (!topic) return <NotFound />;
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/grammar"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
        {" Grammar library"}
      </Link>
      <header>
        <div className="flex gap-2">
          <Badge tone="primary">{LEVEL_LABELS[topic.level].code}</Badge>
          <Badge>{topic.category}</Badge>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {topic.title}
        </h1>
        <p className="mt-1 text-muted">{topic.summary}</p>
      </header>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">In simple words</h2>
        {topic.simple.map((line) => (
          <p key={line} className="mt-2 leading-relaxed">
            <RichText text={line} />
          </p>
        ))}
        <button
          type="button"
          aria-expanded={details}
          onClick={() => setDetails(!details)}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-text"
        >
          {details ? "Hide details" : "More detail"}{" "}
          <ChevronDown
            className={`size-4 transition-transform ${details ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {details && (
          <div className="mt-3 space-y-3 border-t border-border pt-3 leading-relaxed">
            {topic.detailed.map((line) => (
              <p key={line}>
                <RichText text={line} />
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Examples</h2>
        <ul className="mt-2 divide-y divide-border">
          {topic.examples.map((example) => (
            <li
              key={example}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <RichText text={example} />
              <ListenButton
                text={speakable(example)}
                label=""
                size="sm"
                revealFallback={false}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Common mistakes</h2>
        <ul className="mt-3 space-y-3">
          {topic.mistakes.map((mistake) => (
            <li key={mistake.wrong} className="rounded-xl bg-surface-2 p-3">
              <p className="flex items-start gap-2">
                <CircleX
                  className="mt-0.5 size-4.5 shrink-0 text-danger"
                  aria-label="Incorrect"
                />
                <span className="line-through decoration-danger/60">
                  {mistake.wrong}
                </span>
              </p>
              <p className="mt-1 flex items-start gap-2 font-medium">
                <CircleCheck
                  className="mt-0.5 size-4.5 shrink-0 text-success"
                  aria-label="Correct"
                />
                {mistake.right}
              </p>
              <p className="mt-1 ps-6.5 text-sm text-muted">{mistake.why}</p>
            </li>
          ))}
        </ul>
      </div>
      {(topic.notes?.length ?? 0) > 0 && (
        <div className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Info className="size-5 text-indigo" aria-hidden />
            {" Usage notes"}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 ps-5">
            {topic.notes?.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      <section aria-labelledby="practice-h">
        <h2 id="practice-h" className="mb-3 text-lg font-semibold">
          Practice
        </h2>
        {practising ? (
          <PracticeSession
            exercises={topic.exercises}
            title={topic.title}
            activityType="grammar"
            refId={`grammar:${topic.id}`}
          />
        ) : (
          <Button icon={Dumbbell} onClick={() => setPractising(true)}>
            {"Practise ("}
            {topic.exercises.length}
            {" questions)"}
          </Button>
        )}
      </section>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold">Related topics</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topic.related.map((id) => {
              const related = findGrammarTopic(id);
              return related ? (
                <Link
                  key={id}
                  to={`/grammar/${id}`}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:bg-surface-2"
                >
                  {related.title}
                </Link>
              ) : null;
            })}
          </div>
        </div>
        <ButtonLink
          to={`/tutor?q=${encodeURIComponent(`Can you explain ${topic.title.toLowerCase()} with more examples?`)}`}
          variant="soft"
          icon={Bot}
        >
          Ask the tutor
        </ButtonLink>
      </div>
    </article>
  );
}
