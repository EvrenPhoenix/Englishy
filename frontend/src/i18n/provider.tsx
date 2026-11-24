import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BRAND } from "../../../shared/brand";
import { LANGUAGE_NAMES, type UiLanguage } from "../../../shared/constants";
import en from "./locales/en.json";
import { usePreferences } from "../components/PreferencesProvider";

export type MessageKey = keyof typeof en;
type Dictionary = Partial<Record<MessageKey, string>>;
type Translate = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;
const Context = createContext<Translate>((key) => en[key]);
const dictionaries = import.meta.glob<{ default: Dictionary }>([
  "./locales/*.json",
  "!./locales/en.json",
]);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const {
    prefs: { uiLanguage },
  } = usePreferences();
  const [state, setState] = useState<{
    language: UiLanguage;
    messages: Dictionary;
  }>({ language: "en", messages: en });
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const messages =
          uiLanguage === "en"
            ? en
            : (await dictionaries[`./locales/${uiLanguage}.json`]()).default;
        if (active) setState({ language: uiLanguage, messages });
      } catch {
        if (active) setState({ language: "en", messages: en });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [uiLanguage]);
  useEffect(() => {
    document.documentElement.lang =
      state.language === "zh" ? "zh-Hans" : state.language;
    document.documentElement.dir = LANGUAGE_NAMES[state.language].rtl
      ? "rtl"
      : "ltr";
  }, [state.language]);
  const t: Translate = (key, values) => {
    const args: Record<string, string | number> = {
      brand: BRAND.name,
      tutor: BRAND.tutorName,
      ...values,
    };
    return (state.messages[key] ?? en[key] ?? key).replace(
      /\{(\w+)\}/g,
      (placeholder, name) => (name in args ? String(args[name]) : placeholder),
    );
  };
  return <Context.Provider value={t}>{children}</Context.Provider>;
}
export const useTranslate = () => useContext(Context);
