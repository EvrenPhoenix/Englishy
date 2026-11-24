import type { AiConfig } from './env';

/**
 * Per-feature AI task configuration. Models are chosen from configuration (wrangler vars or
 * secrets) so they can be changed without code changes.
 */
export type TaskName = 'tutor' | 'conversation' | 'assist' | 'report' | 'writing' | 'explain' | 'exercises';

export type TaskConfig = {
  model: (cfg: AiConfig) => string;
  maxTokens: number;
  temperature: number;
  /** Maximum number of prior messages sent as context. */
  historyMessages: number;
  /** Maximum total characters of context history. */
  historyChars: number;
};

export const TASKS: Record<TaskName, TaskConfig> = {
  tutor: { model: (c) => c.models.tutor, maxTokens: 700, temperature: 0.5, historyMessages: 12, historyChars: 9000 },
  conversation: { model: (c) => c.models.conversation, maxTokens: 300, temperature: 0.7, historyMessages: 16, historyChars: 8000 },
  assist: { model: (c) => c.models.structured, maxTokens: 300, temperature: 0.4, historyMessages: 6, historyChars: 3000 },
  report: { model: (c) => c.models.structured, maxTokens: 1400, temperature: 0.2, historyMessages: 30, historyChars: 12000 },
  writing: { model: (c) => c.models.structured, maxTokens: 2400, temperature: 0.1, historyMessages: 0, historyChars: 0 },
  explain: { model: (c) => c.models.tutor, maxTokens: 500, temperature: 0.4, historyMessages: 0, historyChars: 0 },
  exercises: { model: (c) => c.models.structured, maxTokens: 1200, temperature: 0.6, historyMessages: 0, historyChars: 0 },
};

/** Keeps the most recent messages within the message and character budget. */
export function trimHistory<T extends { content: string }>(messages: T[], maxMessages: number, maxChars: number): T[] {
  const out: T[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0 && out.length < maxMessages; i--) {
    const m = messages[i];
    const len = m.content.length;
    if (total + len > maxChars && out.length > 0) break;
    out.unshift(len > maxChars ? { ...m, content: m.content.slice(0, maxChars) } : m);
    total += len;
  }
  return out;
}
