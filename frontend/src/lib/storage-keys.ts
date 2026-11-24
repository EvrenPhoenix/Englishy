// Existing learners depend on these exact keys and wire formats. Do not rename them.
export const storageKeys = {
  theme: "ln-theme",
  sidebar: "ln-sidebar",
  writingDraft: "ln-writing-draft",
  microphoneConsent: "ln-mic-consent",
  lessonDraft: (lessonId: string) => `ln-lesson-draft:${lessonId}` as const,
  // React Router owns this sessionStorage entry and its JSON encoding.
  routerTransitions: "remix-router-transitions",
} as const;

export type Theme = "light" | "dark" | "system";
export type SidebarState = "open" | "collapsed";
export interface LessonOutcome {
  correct: boolean;
  skipped?: boolean;
  deviceSkip?: boolean;
  given?: string;
  expected?: string;
}
export interface LessonDraft {
  version: 1;
  index: number;
  exerciseIds: string; // Ordered exercise IDs joined with "|".
  outcomes: Record<string, LessonOutcome>;
}

export type LocalStorageValues = {
  [storageKeys.theme]: Theme;
  [storageKeys.sidebar]: SidebarState;
  [storageKeys.writingDraft]: string; // Verbatim editor text, including whitespace.
  [storageKeys.microphoneConsent]: "yes"; // Revocation removes the entry.
} & Record<ReturnType<typeof storageKeys.lessonDraft>, LessonDraft>; // JSON encoded, version 1.

export function readString(key: keyof LocalStorageValues) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString<
  K extends Exclude<
    keyof LocalStorageValues,
    ReturnType<typeof storageKeys.lessonDraft>
  >,
>(key: K, value: LocalStorageValues[K]) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage may be disabled. */
  }
}
