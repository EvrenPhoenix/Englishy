import type { z } from 'zod';
import { LIMITS } from '../../shared/constants';
import { getScenario } from '../../shared/scenarios';
import {
  assistRequestSchema,
  conversationReportSchema,
  conversationRequestSchema,
  exerciseRequestSchema,
  explainRequestSchema,
  generatedExerciseSchema,
  reportRequestSchema,
  suggestionsSchema,
  tutorRequestSchema,
  writingFeedbackSchema,
  writingRequestSchema,
  type ChatMessage,
} from '../../shared/schemas';
import type { AiConfig } from '../env';
import { ApiError, json, readJsonBody, withApiHeaders } from '../lib/http';
import { asLearnerData } from '../prompts/common';
import { assistSystemPrompt, conversationSystemPrompt } from '../prompts/conversation';
import { exerciseSystemPrompt, explainSystemPrompt, explainUserMessage } from '../prompts/explain';
import { reportSystemPrompt } from '../prompts/report';
import { tutorSystemPrompt } from '../prompts/tutor';
import { writingSystemPrompt, writingUserMessage } from '../prompts/writing';
import { NvidiaClient, type UpstreamMessage } from '../services/nvidia';
import { TASKS, trimHistory, type TaskName } from '../tasks';

export type RouteContext = { request: Request; cfg: AiConfig; client: NvidiaClient; headers: Record<string, string> };

async function parse<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const body = await readJsonBody(request);
  const result = schema.safeParse(body);
  if (!result.success) throw new ApiError('invalid_request');
  return result.data;
}

function checkMessages(messages: ChatMessage[]) {
  const last = messages.at(-1);
  if (last && last.role === 'user' && last.content.length > LIMITS.messageChars) throw new ApiError('payload_too_large');
}

function history(task: TaskName, messages: ChatMessage[]): UpstreamMessage[] {
  const t = TASKS[task];
  return trimHistory(messages, t.historyMessages, t.historyChars).map((m) => ({ role: m.role, content: m.content }));
}

function sse(stream: ReadableStream<Uint8Array>, headers: Record<string, string>): Response {
  return withApiHeaders(new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }), {
    ...headers,
    'X-Accel-Buffering': 'no',
  });
}

const opts = (task: TaskName, cfg: AiConfig, messages: UpstreamMessage[], signal: AbortSignal) => ({
  model: TASKS[task].model(cfg),
  maxTokens: TASKS[task].maxTokens,
  temperature: TASKS[task].temperature,
  messages,
  signal,
});

export const aiRoutes: Record<string, (ctx: RouteContext) => Promise<Response>> = {
  async tutor({ request, cfg, client, headers }) {
    const req = await parse(request, tutorRequestSchema);
    checkMessages(req.messages);
    if (req.messages.at(-1)?.role !== 'user') throw new ApiError('invalid_request');
    const messages: UpstreamMessage[] = [{ role: 'system', content: tutorSystemPrompt(req) }, ...history('tutor', req.messages)];
    return sse(await client.stream(opts('tutor', cfg, messages, request.signal)), headers);
  },

  async conversation({ request, cfg, client, headers }) {
    const req = await parse(request, conversationRequestSchema);
    checkMessages(req.messages);
    const scenario = getScenario(req.scenarioId);
    if (!scenario) throw new ApiError('invalid_request');
    const turns = history('conversation', req.messages);
    // The scenario opening line is the AI's first turn; it is fixed, reviewed text.
    const messages: UpstreamMessage[] = [
      { role: 'system', content: conversationSystemPrompt(req, scenario) },
      { role: 'assistant', content: scenario.opening },
      ...(turns[0]?.role === 'assistant' && turns[0].content === scenario.opening ? turns.slice(1) : turns),
    ];
    if (messages.at(-1)?.role !== 'user') throw new ApiError('invalid_request');
    return sse(await client.stream(opts('conversation', cfg, messages, request.signal)), headers);
  },

  async assist({ request, cfg, client, headers }) {
    const req = await parse(request, assistRequestSchema);
    const scenario = getScenario(req.scenarioId);
    if (!scenario) throw new ApiError('invalid_request');
    const transcript = history('assist', req.messages)
      .map((m) => `${m.role === 'user' ? 'Learner' : 'Other speaker'}: ${m.content}`)
      .join('\n');
    const lastOther = [...req.messages].reverse().find((m) => m.role === 'assistant')?.content ?? scenario.opening;
    const messages: UpstreamMessage[] = [
      { role: 'system', content: assistSystemPrompt(req.profile, scenario, req.kind) },
      {
        role: 'user',
        content: asLearnerData('Conversation so far', transcript || `Other speaker: ${scenario.opening}`) + `\n\nLast message from the other speaker: "${lastOther.slice(0, 600)}"`,
      },
    ];
    const o = opts('assist', cfg, messages, request.signal);
    if (req.kind === 'replies') {
      const data = await client.completeJson(o, suggestionsSchema);
      return json(data, 200, headers);
    }
    const text = await client.complete(o);
    if (!text) throw new ApiError('invalid_output');
    return json({ text: text.slice(0, 2000) }, 200, headers);
  },

  async report({ request, cfg, client, headers }) {
    const req = await parse(request, reportRequestSchema);
    const scenario = getScenario(req.scenarioId);
    if (!scenario) throw new ApiError('invalid_request');
    if (!req.messages.some((m) => m.role === 'user')) throw new ApiError('invalid_request');
    const transcript = history('report', req.messages)
      .map((m) => `${m.role === 'user' ? 'LEARNER' : 'PARTNER'}: ${m.content}`)
      .join('\n');
    const messages: UpstreamMessage[] = [
      { role: 'system', content: reportSystemPrompt(req.profile, scenario) },
      { role: 'user', content: asLearnerData('Conversation transcript', transcript) },
    ];
    const data = await client.completeJson(opts('report', cfg, messages, request.signal), conversationReportSchema);
    return json(data, 200, headers);
  },

  async writing({ request, cfg, client, headers }) {
    const req = await parse(request, writingRequestSchema);
    const messages: UpstreamMessage[] = [
      { role: 'system', content: writingSystemPrompt(req) },
      { role: 'user', content: writingUserMessage(req) },
    ];
    const o = { ...opts('writing', cfg, messages, request.signal) };
    // Budget output tokens roughly to the input size.
    o.maxTokens = Math.min(TASKS.writing.maxTokens, 600 + Math.ceil(req.text.length / 2) * (req.includeImproved ? 2 : 1));
    const data = await client.completeJson(o, writingFeedbackSchema);
    // Keep only issues that actually point at text the learner wrote.
    const issues = data.issues.filter((i) => req.text.includes(i.original) && i.original !== i.suggestion);
    return json({ ...data, issues, improved: req.includeImproved ? (data.improved ?? null) : null }, 200, headers);
  },

  async explain({ request, cfg, client, headers }) {
    const req = await parse(request, explainRequestSchema);
    const messages: UpstreamMessage[] = [
      { role: 'system', content: explainSystemPrompt(req) },
      { role: 'user', content: explainUserMessage(req) },
    ];
    return sse(await client.stream(opts('explain', cfg, messages, request.signal)), headers);
  },

  async exercises({ request, cfg, client, headers }) {
    const req = await parse(request, exerciseRequestSchema);
    const messages: UpstreamMessage[] = [
      { role: 'system', content: exerciseSystemPrompt(req.profile) },
      { role: 'user', content: asLearnerData(`Write ${req.count} questions about this topic`, req.topic) },
    ];
    const data = await client.completeJson(opts('exercises', cfg, messages, request.signal), generatedExerciseSchema, (d) =>
      d.exercises.every(
        (e) =>
          e.answerIndex < e.options.length &&
          new Set(e.options.map((o) => o.trim().toLowerCase())).size === e.options.length,
      ),
    );
    return json(data, 200, headers);
  },
};
