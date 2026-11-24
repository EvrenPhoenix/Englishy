/** Shared enumerations used by both the web app and the Worker. */

export const LEVELS = ['pre-a1', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, { code: string; name: string }> = {
  'pre-a1': { code: 'Pre-A1', name: 'Absolute beginner' },
  a1: { code: 'A1', name: 'Beginner' },
  a2: { code: 'A2', name: 'Elementary' },
  b1: { code: 'B1', name: 'Intermediate' },
  b2: { code: 'B2', name: 'Upper intermediate' },
  c1: { code: 'C1', name: 'Advanced' },
  c2: { code: 'C2', name: 'Proficient' },
};

/** Languages with static interface translations. Codes are BCP 47. */
export const UI_LANGUAGES = ['en', 'hi', 'bn', 'es', 'fr', 'pt', 'ar', 'zh'] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

/** Native languages a learner can choose. 'other' means explanations stay in simple English. */
export const NATIVE_LANGUAGES = [...UI_LANGUAGES, 'other'] as const;
export type NativeLanguage = (typeof NATIVE_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<NativeLanguage, { english: string; native: string; rtl?: boolean }> = {
  en: { english: 'English', native: 'English' },
  hi: { english: 'Hindi', native: 'हिन्दी' },
  bn: { english: 'Bengali', native: 'বাংলা' },
  es: { english: 'Spanish', native: 'Español' },
  fr: { english: 'French', native: 'Français' },
  pt: { english: 'Portuguese', native: 'Português' },
  ar: { english: 'Arabic', native: 'العربية', rtl: true },
  zh: { english: 'Chinese (Simplified)', native: '简体中文' },
  other: { english: 'Another language', native: 'Other' },
};

export const GOALS = [
  'everyday',
  'travel',
  'education',
  'employment',
  'interviews',
  'business',
  'academic',
  'exams',
  'personal',
] as const;
export type Goal = (typeof GOALS)[number];

export const VARIETIES = ['british', 'american'] as const;
export type Variety = (typeof VARIETIES)[number];

export const CORRECTION_MODES = ['immediate', 'major', 'end'] as const;
export type CorrectionMode = (typeof CORRECTION_MODES)[number];

export const WRITING_MODES = ['everyday', 'email', 'academic', 'business', 'creative', 'exam', 'grammar'] as const;
export type WritingMode = (typeof WRITING_MODES)[number];

/** Hard limits shared by client validation and server validation. */
export const LIMITS = {
  messageChars: 1200,
  writingChars: 4000,
  historyMessages: 12,
  historyCharsTotal: 9000,
  recentMistakes: 5,
  knownWords: 30,
} as const;
