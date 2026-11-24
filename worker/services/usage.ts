import type { AiConfig, AppEnv } from '../env';
import { ApiError } from '../lib/http';

/**
 * Usage safeguards for AI endpoints.
 * 1. Burst limit per client: the Workers Rate Limiting binding when configured, otherwise an
 *    in-memory sliding window (per isolate, best effort).
 * 2. Daily caps per client and globally: D1 when bound (durable, parameterised SQL), otherwise
 *    in-memory counters per isolate (best effort; documented as a limitation).
 * Clients are identified by a salted SHA-256 hash of their IP address; raw IPs are never stored.
 */

const BURST_LIMIT = 12;
const BURST_WINDOW_MS = 60_000;
const memoryBurst = new Map<string, number[]>();
const memoryDaily = new Map<string, number>();

export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function clientKey(request: Request, day = today()): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'local';
  const data = new TextEncoder().encode(`linguanest:${day}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function checkBurst(env: AppEnv, key: string, now = Date.now()): Promise<void> {
  if (env.AI_RATE_LIMITER) {
    const { success } = await env.AI_RATE_LIMITER.limit({ key });
    if (!success) throw new ApiError('rate_limited', 30);
    return;
  }
  const times = (memoryBurst.get(key) ?? []).filter((t) => now - t < BURST_WINDOW_MS);
  if (times.length >= BURST_LIMIT) {
    const retry = Math.ceil((BURST_WINDOW_MS - (now - times[0])) / 1000);
    throw new ApiError('rate_limited', Math.max(1, retry));
  }
  times.push(now);
  memoryBurst.set(key, times);
  if (memoryBurst.size > 5000) memoryBurst.clear();
}

async function incrementD1(db: D1Database, day: string, client: string): Promise<number> {
  const row = await db
    .prepare(
      'INSERT INTO ai_usage (day, client, count) VALUES (?1, ?2, 1) ON CONFLICT(day, client) DO UPDATE SET count = count + 1 RETURNING count',
    )
    .bind(day, client)
    .first<{ count: number }>();
  return row?.count ?? 1;
}

function incrementMemory(day: string, client: string): number {
  const k = `${day}:${client}`;
  const n = (memoryDaily.get(k) ?? 0) + 1;
  memoryDaily.set(k, n);
  if (memoryDaily.size > 20000) {
    for (const key of memoryDaily.keys()) if (!key.startsWith(day)) memoryDaily.delete(key);
  }
  return n;
}

export async function recordDailyUse(env: AppEnv, cfg: AiConfig, client: string, day = today()): Promise<void> {
  let perClient: number;
  let global: number;
  if (env.DB) {
    try {
      [perClient, global] = await Promise.all([incrementD1(env.DB, day, client), incrementD1(env.DB, day, '__global__')]);
    } catch {
      perClient = incrementMemory(day, client);
      global = incrementMemory(day, '__global__');
    }
  } else {
    perClient = incrementMemory(day, client);
    global = incrementMemory(day, '__global__');
  }
  if (perClient > cfg.dailyPerClient || global > cfg.dailyGlobal) {
    const now = new Date();
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    throw new ApiError('daily_limit', Math.ceil((midnight - now.getTime()) / 1000));
  }
}

/** Test helper. */
export function resetMemoryUsage(): void {
  memoryBurst.clear();
  memoryDaily.clear();
}
