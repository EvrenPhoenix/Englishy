import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "./PreferencesProvider";
import { Segmented } from "./Controls";

const icons = { light: Sun, dark: Moon, system: Monitor };

/** Light / dark / system switch. Compact shows icons only. */
export function ThemeToggle({ compact = true }: { compact?: boolean }) {
  const t = useTranslate(),
    { prefs, update } = usePreferences();
  return (
    <Segmented
      label={t("theme.label")}
      value={prefs.theme}
      onChange={(theme) => void update({ theme })}
      size={compact ? "sm" : "md"}
      options={(["light", "dark", "system"] as const).map((theme) => ({
        value: theme,
        icon: icons[theme],
        label: compact ? undefined : t(`theme.${theme}`),
        ariaLabel: compact ? t(`theme.${theme}`) : undefined,
      }))}
    />
  );
}
