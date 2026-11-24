import {
  UI_LANGUAGES,
  type UiLanguage,
  type Level,
  type Goal,
  type Variety,
  type CorrectionMode,
  type NativeLanguage,
} from "../../../shared/constants";
import type { Theme } from "./storage-keys";

export interface Preferences {
  uiLanguage: UiLanguage;
  nativeLanguage: NativeLanguage;
  explanationLanguage: NativeLanguage;
  level: Level;
  goals: Goal[];
  variety: Variety;
  dailyGoalMinutes: number;
  theme: Theme;
  textSize: "normal" | "large" | "xlarge";
  reducedMotion: boolean;
  speechRate: number;
  voiceURI: string | null;
  correctionMode: CorrectionMode;
  saveConversations: boolean;
  streaksEnabled: boolean;
  showTranslations: "auto" | "always" | "never";
  onboarding: { completed: boolean; step: number; placementTaken: boolean };
  createdAt: string;
}

export function defaultPreferences(): Preferences {
  const language =
    (navigator.languages ?? [navigator.language])
      .map((code) => code.toLowerCase().split("-")[0])
      .find((code): code is UiLanguage =>
        UI_LANGUAGES.some((lang) => lang === code),
      ) ?? "en";
  return {
    uiLanguage: language,
    nativeLanguage: language,
    explanationLanguage: language,
    level: "pre-a1",
    goals: [],
    variety: "british",
    dailyGoalMinutes: 10,
    theme: "system",
    textSize: "normal",
    reducedMotion: false,
    speechRate: 0.9,
    voiceURI: null,
    correctionMode: "major",
    saveConversations: true,
    streaksEnabled: true,
    showTranslations: "auto",
    onboarding: { completed: false, step: 0, placementTaken: false },
    createdAt: new Date().toISOString(),
  };
}
