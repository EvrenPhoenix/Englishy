import { useMemo } from "react";
import { usePreferences } from "../components/PreferencesProvider";

/** The learner details sent with every AI request. */
export function useAiProfile() {
  const { prefs } = usePreferences();
  return useMemo(
    () => ({
      level: prefs.level,
      nativeLanguage: prefs.nativeLanguage,
      explanationLanguage: prefs.explanationLanguage,
      variety: prefs.variety,
      goals: prefs.goals,
    }),
    [
      prefs.level,
      prefs.nativeLanguage,
      prefs.explanationLanguage,
      prefs.variety,
      prefs.goals,
    ],
  );
}
export type AiProfile = ReturnType<typeof useAiProfile>;
