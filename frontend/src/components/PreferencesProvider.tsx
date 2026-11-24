import { learnerDatabase } from "../lib/storage-keys";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BRAND } from "../../../shared/brand";
import { loadPreferences, subscribe, updatePreferences } from "../lib/database";
import { defaultPreferences, type Preferences } from "../lib/preferences";
import { readString, storageKeys, writeString } from "../lib/storage-keys";

const Context = createContext<{
  prefs: Preferences;
  persistent: boolean;
  ready: boolean;
  update: typeof updatePreferences;
} | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    const prefs = defaultPreferences();
    const theme = readString(storageKeys.theme);
    if (theme === "light" || theme === "dark") prefs.theme = theme;
    return { prefs, persistent: true };
  });
  const [ready, setReady] = useState(false);
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    let revision = 0;
    async function refresh() {
      const current = ++revision;
      const next = await loadPreferences();
      if (current === revision) {
        setState(next);
        setReady(true);
      }
    }
    void refresh();
    const unsubscribe = subscribe(learnerDatabase.stores.kv, refresh);
    return () => {
      revision++;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystemDark(query.matches);
    query.addEventListener("change", change);
    change();
    return () => query.removeEventListener("change", change);
  }, []);
  const { theme, textSize, reducedMotion } = state.prefs;
  useEffect(() => {
    const mode = theme === "system" ? (systemDark ? "dark" : "light") : theme;
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.textSize = textSize;
    if (reducedMotion) root.dataset.motion = "reduce";
    else delete root.dataset.motion;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", BRAND.themeColor[mode]);
    if (ready) writeString(storageKeys.theme, theme);
  }, [theme, systemDark, textSize, reducedMotion, ready]);
  return (
    <Context.Provider value={{ ...state, ready, update: updatePreferences }}>
      {children}
    </Context.Provider>
  );
}
export function usePreferences() {
  const state = useContext(Context);
  if (!state) throw Error("PreferencesProvider is required");
  return state;
}
