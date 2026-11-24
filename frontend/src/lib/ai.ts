// Browser client for the Worker's /api/ai/* routes: JSON requests, streamed
// (server-sent event) replies, and learner-friendly error messages.

export class AiError extends Error {
  code: string;
  retryAfter?: number;
  constructor(code: string, message: string, retryAfter?: number) {
    super(message);
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

const messages = {
  offline:
    "You are offline. AI features need an internet connection. Lessons, vocabulary and grammar still work.",
  network:
    "We could not reach the AI service. Check your connection and try again.",
  aborted: "Stopped.",
};
const STREAM_IDLE_MS = 60_000;

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

async function errorFromResponse(response: Response) {
  try {
    const body = await response.json();
    if (body?.error?.code)
      return new AiError(
        body.error.code,
        body.error.message ?? messages.network,
        body.error.retryAfter,
      );
  } catch {
    // Not JSON: fall through to the generic message.
  }
  return new AiError(
    response.status === 429 ? "rate_limited" : "upstream_unavailable",
    "The AI service is temporarily unavailable. Please try again shortly.",
  );
}

function errorFromFailure(error: unknown, signal?: AbortSignal) {
  if (
    signal?.aborted ||
    (error instanceof DOMException && error.name === "AbortError")
  )
    return new AiError("aborted", messages.aborted);
  if (isOffline()) return new AiError("offline", messages.offline);
  return new AiError("network", messages.network);
}

export async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
) {
  if (isOffline()) throw new AiError("offline", messages.offline);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw errorFromFailure(error, signal);
  }
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as T;
}

const timeoutError = () =>
  new AiError("timeout", "The AI took too long to reply. Please try again.");

/**
 * POST and read a streamed reply. `onDelta` receives each new chunk and the text so
 * far. The request is abandoned after 60 seconds without new data.
 */
export async function streamText(
  url: string,
  body: unknown,
  onDelta: (chunk: string, text: string) => void,
  signal?: AbortSignal,
) {
  if (isOffline()) throw new AiError("offline", messages.offline);
  const idle = new AbortController();
  const combined = signal
    ? AbortSignal.any([signal, idle.signal])
    : idle.signal;
  let timer = setTimeout(() => idle.abort(), STREAM_IDLE_MS);
  const keepAlive = () => {
    clearTimeout(timer);
    timer = setTimeout(() => idle.abort(), STREAM_IDLE_MS);
  };
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal: combined,
    });
  } catch (error) {
    clearTimeout(timer);
    throw idle.signal.aborted && !signal?.aborted
      ? timeoutError()
      : errorFromFailure(error, signal);
  }
  if (!response.ok || !response.body) {
    clearTimeout(timer);
    throw await errorFromResponse(response);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "",
    text = "",
    finishReason = "stop";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      keepAlive();
      buffer += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const event = /^event: (.+)$/m.exec(block)?.[1];
        const data = /^data: (.+)$/m.exec(block)?.[1];
        if (!event || !data) continue;
        const payload = JSON.parse(data);
        if (event === "delta" && payload.text) {
          text += payload.text;
          onDelta(payload.text, text);
        } else if (event === "done")
          finishReason = payload.finishReason ?? "stop";
        else if (event === "error")
          throw new AiError(
            payload.code ?? "upstream_unavailable",
            "The AI reply was interrupted. Please try again.",
          );
      }
    }
  } catch (error) {
    throw error instanceof AiError
      ? error
      : idle.signal.aborted && !signal?.aborted
        ? timeoutError()
        : errorFromFailure(error, signal);
  } finally {
    clearTimeout(timer);
  }
  return { text, finishReason };
}

export function aiErrorMessage(error: unknown) {
  if (!(error instanceof AiError)) return messages.network;
  return error.code === "rate_limited" && error.retryAfter
    ? `${error.message} (about ${Math.ceil(error.retryAfter)} seconds)`
    : error.message;
}
