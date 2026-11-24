import { useEffect, useMemo, useState } from "react";

const confettiColours = [
  "#14b8a6",
  "#0f766e",
  "#6366f1",
  "#a855f7",
  "#f59e0b",
  "#f43f5e",
  "#22c55e",
];

/** A short burst of confetti for a completed lesson. */
export function Confetti({
  pieces = 70,
  duration = 3200,
}: {
  pieces?: number;
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration + 1200);
    return () => clearTimeout(timer);
  }, [duration]);
  const styles = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        const size = 6 + Math.random() * 6;
        return {
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size * (0.4 + Math.random() * 0.8)}px`,
          background: confettiColours[i % confettiColours.length],
          animationDuration: `${duration * (0.6 + Math.random() * 0.5)}ms`,
          animationDelay: `${Math.random() * 350}ms`,
          "--rot": `${Math.round(Math.random() * 360)}deg`,
          "--drift": `${Math.round((Math.random() - 0.5) * 220)}px`,
        } as React.CSSProperties;
      }),
    [pieces, duration],
  );
  return visible ? (
    <div
      className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {styles.map((style, i) => (
        <span key={i} style={style} />
      ))}
    </div>
  ) : null;
}
