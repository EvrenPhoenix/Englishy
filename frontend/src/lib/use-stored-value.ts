import { useState, useEffect } from "react";
import { subscribe } from "./database";
export function useStoredValue<T, I>(
  store: string | readonly string[],
  read: () => Promise<T>,
  initial: I,
) {
  const [value, setValue] = useState<T | I>(initial);
  useEffect(() => {
    let revision = 0;
    async function refresh() {
      const current = ++revision;
      const next = await read();
      if (revision === current) setValue(next);
    }
    void refresh();
    const stores = typeof store === "string" ? [store] : store;
    const subscriptions = stores.map((name) => subscribe(name, refresh));
    return () => {
      revision++;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [read, store]);
  return value;
}
