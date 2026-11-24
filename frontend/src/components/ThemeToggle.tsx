import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslate } from "../i18n/provider";
import { usePreferences } from "./PreferencesProvider";
export function ThemeToggle() {
  const t = useTranslate(),
    { prefs, update } = usePreferences();
  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label")}
      className="inline-flex gap-0.5 rounded-full bg-surface-2 p-1"
    >
      {(["light", "dark", "system"] as const).map((theme) => {
        const Icon = { light: Sun, dark: Moon, system: Monitor }[theme];
        return (
          <button
            type="button"
            role="radio"
            key={theme}
            aria-label={t(`theme.${theme}`)}
            title={t(`theme.${theme}`)}
            aria-checked={prefs.theme === theme}
            onClick={() => void update({ theme })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors text-muted hover:text-text aria-checked:bg-raised aria-checked:text-text aria-checked:shadow-sm aria-checked:ring-1 aria-checked:ring-border"
          >
            <Icon aria-hidden="true" className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
