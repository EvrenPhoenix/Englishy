import { useCallback, useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"];

/**
 * Counts seconds while the tab is visible and the learner interacted within the
 * last two minutes. `take` returns the count and resets it.
 */
export function useActiveTime() {
  const seconds = useRef(0);
  const lastInput = useRef(Date.now());
  useEffect(() => {
    const touch = () => (lastInput.current = Date.now());
    for (const name of ACTIVITY_EVENTS)
      window.addEventListener(name, touch, { passive: true });
    const timer = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastInput.current < 120_000
      )
        seconds.current += 1;
    }, 1000);
    return () => {
      clearInterval(timer);
      for (const name of ACTIVITY_EVENTS)
        window.removeEventListener(name, touch);
    };
  }, []);
  return {
    take: useCallback(() => {
      const value = seconds.current;
      seconds.current = 0;
      return value;
    }, []),
    peek: useCallback(() => seconds.current, []),
  };
}
