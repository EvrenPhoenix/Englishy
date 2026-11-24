import { RefreshCw } from "lucide-react";
import { type Scenario } from "../../../../shared/scenarios";
import { type ConversationReport } from "../../../../shared/schemas";
import { Button, ButtonLink } from "../../components/ui";
import { TutorMark } from "../../components/ChatMessages";
import { ScrollPage } from "./helpers";

export function ReportView({
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
