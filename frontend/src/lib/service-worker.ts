// Service worker registration. A new version waits until the learner accepts the
// update banner, so nobody is interrupted mid-lesson; accepting reloads once.
const listeners = new Set<() => void>();
let waiting: ServiceWorker | null = null;
let accepted = false;

/** Call `listener` when an update is ready (immediately if one already is). */
export function onUpdateReady(listener: () => void) {
  listeners.add(listener);
  if (waiting) listener();
  return () => {
    listeners.delete(listener);
  };
}

export function applyUpdate() {
  if (!waiting) return;
  accepted = true;
  waiting.postMessage({ type: "SKIP_WAITING" });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        const offer = (worker: ServiceWorker | null) => {
          // Only an update, not the first install, needs the banner.
          if (worker && navigator.serviceWorker.controller) {
            waiting = worker;
            for (const listener of listeners) listener();
          }
        };
        offer(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          installing?.addEventListener(
            "statechange",
            () => installing.state === "installed" && offer(installing),
          );
        });
        setInterval(
          () => void registration.update().catch(() => {}),
          3_600_000,
        );
      })
      .catch(() => {});
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloading && accepted) {
        reloading = true;
        window.location.reload();
      }
    });
  });
}
