import type { AiErrorCode } from '../../shared/schemas';

const API_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Robots-Tag': 'noindex',
};

export function withApiHeaders(res: Response, extra: Record<string, string> = {}): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries({ ...API_HEADERS, ...extra })) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return withApiHeaders(Response.json(data, { status }), extra);
}

/** User-facing messages. Never include upstream details, stack traces or configuration. */
const MESSAGES: Record<AiErrorCode, string> = {
  ai_disabled: 'AI features are switched off on this server. Lessons and practice still work.',
  ai_not_configured: 'AI features are not set up on this server yet. Lessons and practice still work.',
  invalid_request: 'That request could not be processed. Please check your message and try again.',
  rate_limited: 'You are sending messages quickly. Please wait a moment and try again.',
  daily_limit: 'The daily AI limit has been reached. You can keep learning with lessons, vocabulary and grammar, and AI will be available again tomorrow.',
  upstream_rate_limited: 'The AI service is busy right now. Please try again in a minute.',
  upstream_unavailable: 'The AI service is temporarily unavailable. Please try again shortly.',
  invalid_model: 'The AI model configured on this server is not available. Please tell the site administrator.',
  timeout: 'The AI took too long to reply. Please try again, perhaps with a shorter message.',
  invalid_output: 'The AI gave an answer we could not check. Please try again.',
  forbidden_origin: 'This request is not allowed from this website.',
  payload_too_large: 'That message is too long. Please shorten it and try again.',
  internal: 'Something went wrong on our side. Please try again.',
};

const STATUS: Record<AiErrorCode, number> = {
  ai_disabled: 503,
  ai_not_configured: 503,
  invalid_request: 400,
  rate_limited: 429,
  daily_limit: 429,
  upstream_rate_limited: 503,
  upstream_unavailable: 502,
  invalid_model: 502,
  timeout: 504,
  invalid_output: 502,
  forbidden_origin: 403,
  payload_too_large: 413,
  internal: 500,
};

export class ApiError extends Error {
  constructor(
    public code: AiErrorCode,
    public retryAfter?: number,
  ) {
    super(code);
  }
}

export function errorResponse(code: AiErrorCode, retryAfter?: number, extra: Record<string, string> = {}): Response {
  const headers = retryAfter ? { 'Retry-After': String(retryAfter), ...extra } : extra;
  return json({ error: { code, message: MESSAGES[code], ...(retryAfter ? { retryAfter } : {}) } }, STATUS[code], headers);
}

export const MAX_BODY_BYTES = 64 * 1024;

/** Reads a JSON body with a hard size limit (does not trust Content-Length alone). */
export async function readJsonBody(request: Request, maxBytes = MAX_BODY_BYTES): Promise<unknown> {
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > maxBytes) throw new ApiError('payload_too_large');
  const type = request.headers.get('Content-Type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) throw new ApiError('invalid_request');
  if (!request.body) throw new ApiError('invalid_request');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new ApiError('payload_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError('invalid_request');
  }
}
