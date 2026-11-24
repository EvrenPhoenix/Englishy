/** Runtime bindings and configuration. Values are strings because Wrangler vars are strings. */
export interface AppEnv {
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  NVIDIA_MODEL_TUTOR?: string;
  NVIDIA_MODEL_CONVERSATION?: string;
  NVIDIA_MODEL_STRUCTURED?: string;
  NVIDIA_MODEL_FAST?: string;
  /** "auto" (default): disable reasoning for Nemotron models. "on" / "off" force the behaviour. */
  NVIDIA_DISABLE_THINKING?: string;
  AI_ENABLED?: string;
  AI_DAILY_LIMIT_PER_CLIENT?: string;
  AI_DAILY_GLOBAL_LIMIT?: string;
  AI_MAX_OUTPUT_TOKENS?: string;
  AI_TIMEOUT_MS?: string;
  ALLOWED_ORIGINS?: string;
  AI_RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  DB?: D1Database;
  ASSETS?: Fetcher;
}

export type AiConfig = {
  enabled: boolean;
  configured: boolean;
  apiKey: string;
  baseUrl: string;
  models: { default: string; tutor: string; conversation: string; structured: string; fast: string };
  disableThinking: 'auto' | 'on' | 'off';
  dailyPerClient: number;
  dailyGlobal: number;
  maxOutputTokens: number;
  timeoutMs: number;
  allowedOrigins: string[];
};

const int = (v: string | undefined, fallback: number, min: number, max: number) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const MODEL_ID = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

export function readConfig(env: AppEnv): AiConfig {
  const key = (env.NVIDIA_API_KEY ?? '').trim();
  const pick = (v: string | undefined, fallback: string) => (v && MODEL_ID.test(v.trim()) ? v.trim() : fallback);
  const def = pick(env.NVIDIA_MODEL, 'nvidia/nemotron-3-ultra-550b-a55b');
  const base = (env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1').trim().replace(/\/+$/, '');
  const thinking = env.NVIDIA_DISABLE_THINKING === 'on' || env.NVIDIA_DISABLE_THINKING === 'off' ? env.NVIDIA_DISABLE_THINKING : 'auto';
  return {
    enabled: (env.AI_ENABLED ?? 'true').toLowerCase() !== 'false',
    configured: key.length > 10 && base.startsWith('https://'),
    apiKey: key,
    baseUrl: base,
    models: {
      default: def,
      tutor: pick(env.NVIDIA_MODEL_TUTOR, def),
      conversation: pick(env.NVIDIA_MODEL_CONVERSATION, def),
      structured: pick(env.NVIDIA_MODEL_STRUCTURED, def),
      fast: pick(env.NVIDIA_MODEL_FAST, def),
    },
    disableThinking: thinking,
    dailyPerClient: int(env.AI_DAILY_LIMIT_PER_CLIENT, 150, 1, 100000),
    dailyGlobal: int(env.AI_DAILY_GLOBAL_LIMIT, 3000, 1, 10000000),
    maxOutputTokens: int(env.AI_MAX_OUTPUT_TOKENS, 2400, 64, 8192),
    timeoutMs: int(env.AI_TIMEOUT_MS, 45000, 3000, 120000),
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter((s) => /^https?:\/\/[^/]+$/.test(s)),
  };
}
