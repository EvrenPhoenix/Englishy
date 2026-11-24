import { useEffect, useState } from "react";

interface AiStatus {
  available: boolean;
  enabled: boolean;
  configured: boolean;
}
let pending: Promise<AiStatus> | undefined;

function loadStatus(refresh = false) {
  if (!pending || refresh) {
    pending = fetch("/api/ai/status", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as AiStatus)
          : { available: false, enabled: false, configured: false },
      )
      .catch(() => {
        pending = undefined;
        return { available: false, enabled: true, configured: true };
      });
  }
  return pending;
}

export function useAiStatus() {
  const [status, setStatus] = useState<AiStatus>();
  useEffect(() => {
    let active = true;
    function refresh(force = false) {
      void loadStatus(force).then((value) => {
        if (active) setStatus(value);
      });
    }
    refresh();
    const online = () => refresh(true);
    window.addEventListener("online", online);
    return () => {
      active = false;
      window.removeEventListener("online", online);
    };
  }, []);
  return status;
}
