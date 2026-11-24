/**
 * Central product branding, shared by the web app, the Worker (AI prompts) and the build
 * (index.html metadata, web app manifest, offline page, robots.txt, sitemap).
 *
 * To rename the product, change the values here and the Worker "name" in wrangler.jsonc.
 * Interface translations use {brand} and {tutor} placeholders, so they follow automatically.
 *
 * Internal identifiers (IndexedDB database "linguanest", "ln-*" storage keys, the export
 * format id and service-worker cache prefix) intentionally keep their original names so
 * existing learners never lose their progress after a rename.
 */
export const BRAND = {
  name: 'Englishy',
  tagline: 'Learn English. Build confidence. Speak naturally.',
  description:
    'Englishy is a free English learning app with structured lessons from absolute beginner to A1, interactive practice and an AI tutor powered by NVIDIA.',
  /** Name the AI tutor uses for itself in the interface and in prompts. */
  tutorName: 'Englishy',
  /** Used for canonical URLs and the sitemap when VITE_SITE_URL is not set at build time. */
  defaultSiteUrl: 'https://englishy.assistant-service.workers.dev',
  themeColor: { light: '#ffffff', dark: '#131314', brand: '#0f766e' },
} as const;
