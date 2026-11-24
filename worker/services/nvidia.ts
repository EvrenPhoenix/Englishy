import type { z } from 'zod';
import type { AiConfig } from '../env';
import { ApiError } from '../lib/http';

/**
 * NVIDIA API client (OpenAI-compatible chat completions at integrate.api.nvidia.com/v1).
 * - Bearer authentication with a server-side key only.
 * - Timeouts and cancellation via AbortSignal.
 * - Exponential backoff with jitter for transient failures (429/502/503/504/network) before any
 *   bytes are streamed to the client.
 * - Reasoning ("thinking") is switched off for Nemotron models to keep replies fast and direct.
 */

export type UpstreamMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatOptions = {
  model: string;
  messages: UpstreamMessage[];
  maxTokens: number;
  temperature: number;
  json?: boolean;
  signal?: AbortSignal;
};

type Fetch = typeof fetch;

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    });
  });

export function shouldDisableThinking(cfg: AiConfig, model: string): boolean {
  if (cfg.disableThinking === 'on') return true;
  if (cfg.disableThinking === 'off') return false;
  return model.startsWith('nvidia/nemotron');
}

export class NvidiaClient {
  constructor(
    private cfg: AiConfig,
    private fetchImpl: Fetch = fetch,
    private backoffBaseMs = 400,
    private maxRetries = 2,
  ) {}

  private body(opts: ChatOptions, stream: boolean) {
    return JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      max_tokens: Math.min(opts.maxTokens, this.cfg.maxOutputTokens),
      temperature: opts.temperature,
      top_p: 0.95,
      stream,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
      ...(shouldDisableThinking(this.cfg, opts.model) ? { chat_template_kwargs: { enable_thinking: false } } : {}),
    });
  }

  /** Performs the HTTP call with retries. Returns an OK upstream response or throws ApiError. */
  async request(opts: ChatOptions, stream: boolean): Promise<Response> {
    const timeout = AbortSignal.timeout(this.cfg.timeoutMs);
    const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
    const body = this.body(opts, stream);
    let attempt = 0;
    for (;;) {
      let res: Response | undefined;
      try {
        // Call fetch unbound: invoking the Workers fetch as a method ("this.fetchImpl(...)") throws "Illegal invocation".
        const doFetch = this.fetchImpl;
        res = await doFetch(`${this.cfg.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.cfg.apiKey}`,
            'Content-Type': 'application/json',
            Accept: stream ? 'text/event-stream' : 'application/json',
          },
          body,
          signal,
        });
      } catch (err) {
        if (timeout.aborted) throw new ApiError('timeout');
        if (opts.signal?.aborted) throw err;
        // Network-level failure. Log only the error type/message (never the request body or key).
        console.warn(JSON.stringify({ event: 'nvidia_network_error', attempt, message: err instanceof Error ? err.message.slice(0, 160) : 'unknown' }));
        if (attempt >= this.maxRetries) throw new ApiError('upstream_unavailable');
      }
      if (res?.ok) return res;
      if (res && !RETRYABLE.has(res.status)) throw await mapUpstreamError(res);
      if (attempt >= this.maxRetries) throw res ? await mapUpstreamError(res) : new ApiError('upstream_unavailable');
      const retryAfter = Number(res?.headers.get('Retry-After'));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0 && retryAfter <= 5
          ? retryAfter * 1000
          : this.backoffBaseMs * 2 ** attempt + Math.random() * this.backoffBaseMs;
      await res?.body?.cancel().catch(() => {});
      try {
        await sleep(wait, signal);
      } catch {
        throw timeout.aborted ? new ApiError('timeout') : new ApiError('upstream_unavailable');
      }
      attempt++;
    }
  }

  async complete(opts: ChatOptions): Promise<string> {
    const res = await this.request(opts, false);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('upstream_unavailable');
    }
    const content = (data as { choices?: { message?: { content?: string | null } }[] })?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new ApiError('invalid_output');
    return stripThinking(content).trim();
  }

  /**
   * Requests JSON output and validates it. Retries once with a repair instruction if the
   * model returns malformed JSON or data that fails the schema.
   */
  async completeJson<T>(opts: ChatOptions, schema: z.ZodType<T>, extraCheck?: (value: T) => boolean): Promise<T> {
    let messages = opts.messages;
    for (let i = 0; i < 2; i++) {
      const text = await this.complete({ ...opts, messages, json: true });
      const parsed = parseJsonLoose(text);
      const result = schema.safeParse(parsed);
      if (result.success && (!extraCheck || extraCheck(result.data))) return result.data;
      messages = [
        ...opts.messages,
        { role: 'assistant', content: text.slice(0, 4000) },
        { role: 'user', content: 'That was not valid JSON in the required shape. Reply again with ONLY the corrected JSON object.' },
      ];
    }
    throw new ApiError('invalid_output');
  }

  /**
   * Streams a completion as the app's own server-sent events:
   *   event: delta  data: {"text": "..."}
   *   event: done   data: {"finishReason": "stop" | "length"}
   *   event: error  data: {"code": "..."}
   */
  async stream(opts: ChatOptions): Promise<ReadableStream<Uint8Array>> {
    const upstream = await this.request(opts, true);
    if (!upstream.body) throw new ApiError('upstream_unavailable');
    return transformUpstreamStream(upstream.body);
  }
}

export function transformUpstreamStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const send = (event: string, data: unknown) => encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const thinking = new ThinkFilter();
  let buffer = '';
  let finishReason = 'stop';
  let finished = false;
  const reader = source.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      // Keep reading until something is enqueued or the stream ends. Returning from pull()
      // without enqueuing would stall the stream (e.g. role-only or reasoning-only chunks).
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            const rest = thinking.flush();
            if (rest) controller.enqueue(send('delta', { text: rest }));
            if (!finished) controller.enqueue(send('done', { finishReason }));
            controller.close();
            return;
          }
          let produced = false;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') {
              const rest = thinking.flush();
              if (rest) controller.enqueue(send('delta', { text: rest }));
              if (!finished) controller.enqueue(send('done', { finishReason }));
              finished = true;
              produced = true;
              continue;
            }
            try {
              const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[] };
              const choice = chunk.choices?.[0];
              if (choice?.finish_reason) finishReason = choice.finish_reason;
              const text = choice?.delta?.content;
              if (text) {
                const visible = thinking.push(text);
                if (visible) {
                  controller.enqueue(send('delta', { text: visible }));
                  produced = true;
                }
              }
            } catch {
              // ignore keep-alive or malformed lines
            }
          }
          if (produced) return;
        }
      } catch {
        controller.enqueue(send('error', { code: 'upstream_unavailable' }));
        controller.close();
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/** Removes inline <think>…</think> blocks if a model emits reasoning in the content stream. */
class ThinkFilter {
  private inThink = false;
  private pending = '';
  push(text: string): string {
    let s = this.pending + text;
    this.pending = '';
    let out = '';
    while (s.length) {
      if (this.inThink) {
        const end = s.indexOf('</think>');
        if (end === -1) {
          this.pending = s.slice(-8);
          return out;
        }
        s = s.slice(end + 8);
        this.inThink = false;
      } else {
        const start = s.indexOf('<think>');
        if (start === -1) {
          // keep a possible partial tag for the next chunk
          const partial = s.lastIndexOf('<');
          if (partial !== -1 && '<think>'.startsWith(s.slice(partial))) {
            out += s.slice(0, partial);
            this.pending = s.slice(partial);
          } else out += s;
          return out;
        }
        out += s.slice(0, start);
        s = s.slice(start + 7);
        this.inThink = true;
      }
    }
    return out;
  }
  flush(): string {
    const p = this.inThink ? '' : this.pending;
    this.pending = '';
    return p;
  }
}

export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^[\s\S]*?<\/think>/, '');
}

/** Parses JSON, tolerating code fences or leading prose around a single object. */
export function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

async function mapUpstreamError(res: Response): Promise<ApiError> {
  let detail = '';
  try {
    detail = (await res.text()).slice(0, 500).toLowerCase();
  } catch {
    // ignore
  }
  if (res.status === 401 || res.status === 403) return new ApiError('ai_not_configured');
  if (res.status === 404 || (res.status === 400 && /model/.test(detail) && /not found|unknown|invalid|does not exist/.test(detail)))
    return new ApiError('invalid_model');
  if (res.status === 429) {
    const ra = Number(res.headers.get('Retry-After'));
    return new ApiError('upstream_rate_limited', Number.isFinite(ra) && ra > 0 ? Math.min(ra, 300) : 30);
  }
  if (res.status === 413) return new ApiError('payload_too_large');
  if (res.status >= 500) return new ApiError('upstream_unavailable');
  return new ApiError('invalid_request');
}
