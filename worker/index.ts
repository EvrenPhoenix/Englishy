import { LIMITS } from '../shared/constants';
import { readConfig, type AppEnv } from './env';
import { ApiError, errorResponse, json } from './lib/http';
import { corsHeaders, isAllowedOrigin } from './middleware/origin';
import { aiRoutes } from './routes/ai';
import { NvidiaClient } from './services/nvidia';
import { checkBurst, clientKey, recordDailyUse } from './services/usage';

type FetchLike = typeof fetch;

export async function handleRequest(request: Request, env: AppEnv, fetchImpl: FetchLike = fetch): Promise<Response> {
  const url = new URL(request.url);
  const cfg = readConfig(env);
  const headers = corsHeaders(request, cfg);

  if (!url.pathname.startsWith('/api/')) {
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
  }

  if (request.method === 'OPTIONS') {
    return isAllowedOrigin(request, cfg) ? new Response(null, { status: 204, headers }) : errorResponse('forbidden_origin');
  }

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({ ok: true }, 200, headers);
  }

  if (url.pathname === '/api/ai/status' && request.method === 'GET') {
    return json(
      {
        enabled: cfg.enabled,
        configured: cfg.configured,
        available: cfg.enabled && cfg.configured,
        limits: { messageChars: LIMITS.messageChars, writingChars: LIMITS.writingChars, dailyPerClient: cfg.dailyPerClient },
        provider: 'NVIDIA',
      },
      200,
      headers,
    );
  }

  const match = /^\/api\/ai\/([a-z]+)$/.exec(url.pathname);
  const route = match ? aiRoutes[match[1]] : undefined;
  if (!route) return json({ error: { code: 'not_found', message: 'Not found' } }, 404, headers);
  if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'Method not allowed' } }, 405, { ...headers, Allow: 'POST' });

  try {
    if (!isAllowedOrigin(request, cfg)) throw new ApiError('forbidden_origin');
    if (!cfg.enabled) throw new ApiError('ai_disabled');
    if (!cfg.configured) throw new ApiError('ai_not_configured');
    const key = await clientKey(request);
    await checkBurst(env, key);
    await recordDailyUse(env, cfg, key);
    const client = new NvidiaClient(cfg, fetchImpl);
    return await route({ request, cfg, client, headers });
  } catch (err) {
    if (err instanceof ApiError) {
      if (!['rate_limited', 'daily_limit', 'invalid_request'].includes(err.code)) {
        // Log only the error code and route, never request content or credentials.
        console.warn(JSON.stringify({ event: 'ai_error', code: err.code, route: match?.[1] }));
      }
      return errorResponse(err.code, err.retryAfter, headers);
    }
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error(JSON.stringify({ event: 'ai_internal_error', route: match?.[1], name: err instanceof Error ? err.name : 'unknown' }));
    return errorResponse('internal', undefined, headers);
  }
}

export default {
  fetch(request, env) {
    return handleRequest(request, env as AppEnv);
  },
} satisfies ExportedHandler<Env>;
