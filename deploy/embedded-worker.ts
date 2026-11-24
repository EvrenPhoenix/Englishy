/**
 * Alternative Worker entry that serves the built site from an embedded module instead of
 * Workers Static Assets. API routes are handled by the normal Worker (worker/index.ts).
 * Wrangler runs scripts/build-embedded.mjs before development or deployment.
 */
// @ts-expect-error generated at build time
import { FILES, HEADER_RULES } from '../dist/embedded/assets.js';
import { handleRequest } from '../worker/index';
import type { AppEnv } from '../worker/env';

type Entry = { t: string; e: string; s?: string; b?: string };
const files = FILES as Record<string, Entry>;
const rules = HEADER_RULES as { pattern: string; headers: Record<string, string> }[];
const binary = new Map<string, Uint8Array>();

function body(path: string, f: Entry): BodyInit {
  if (f.s !== undefined) return f.s;
  let b = binary.get(path);
  if (!b) {
    b = Uint8Array.from(atob(f.b ?? ''), (c) => c.charCodeAt(0));
    binary.set(path, b);
  }
  return b;
}

function matches(pattern: string, path: string): boolean {
  if (pattern.endsWith('/*')) return path.startsWith(pattern.slice(0, -1));
  return pattern === path;
}

function resolve(pathname: string): { path: string; spa: boolean } | null {
  const candidates = [pathname, `${pathname}.html`, `${pathname.replace(/\/$/, '')}/index.html`];
  for (const c of candidates) if (files[c]) return { path: c, spa: false };
  return null;
}

function serve(request: Request): Response {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  let hit = resolve(url.pathname);
  // Single-page application fallback: unknown paths without a file extension get the app shell.
  if (!hit && !/\.[a-z0-9]+$/i.test(url.pathname)) hit = { path: '/index.html', spa: true };
  if (!hit) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const f = files[hit.path];
  const headers = new Headers({ 'Content-Type': f.t, ETag: f.e, 'Cache-Control': 'public, max-age=0, must-revalidate' });
  for (const r of rules) if (matches(r.pattern, url.pathname)) for (const [k, v] of Object.entries(r.headers)) headers.set(k, v);
  if (request.headers.get('If-None-Match') === f.e) return new Response(null, { status: 304, headers });
  return new Response(request.method === 'HEAD' ? null : body(hit.path, f), { status: 200, headers });
}

export default {
  fetch(request: Request, env: AppEnv) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) return handleRequest(request, env);
    return serve(request);
  },
};
