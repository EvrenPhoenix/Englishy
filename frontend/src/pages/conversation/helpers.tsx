import { type ReactNode } from "react";
import { type Scenario } from "../../../../shared/scenarios";
import { Markdown } from "../../components/Markdown";

/** The partner's first name when the role starts with one ("Maria, a waiter…"). */
export function partnerName(scenario: Scenario) {
  const first = scenario.aiRole.split(",")[0].trim();
  return /^[A-Z]/.test(first) && first.length <= 20 ? first : undefined;
}

/** Reply text for speech: no tips line and no Markdown symbols. */
export function speakableReply(text: string) {
  return text
    .replace(/💡.*$/s, "")
    .replace(/[*_#`>]/g, "")
    .trim();
}

export function ScrollPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
        {children}
      </div>
    </div>
  );
}
