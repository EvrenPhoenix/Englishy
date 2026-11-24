import type { AiConfig } from '../env';

/**
 * Same-origin policy for the API. Browsers always send Origin on POST fetches, so a missing
 * or foreign Origin is rejected. Extra origins can be allowed with ALLOWED_ORIGINS.
 */
export function isAllowedOrigin(request: Request, cfg: AiConfig): boolean {
  const origin = request.headers.get('Origin');
  const self = new URL(request.url).origin;
  if (!origin) return request.method === 'GET' || request.method === 'HEAD';
  return origin === self || cfg.allowedOrigins.includes(origin);
}

export function corsHeaders(request: Request, cfg: AiConfig): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (origin && cfg.allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    };
  }
  return { Vary: 'Origin' };
}
