import type { ReactNode } from "react";
import { classes } from "./ui";
const colors = {
  primary: "bg-primary",
  success: "bg-success",
  accent: "bg-accent",
};
function fraction(value: number) {
  return Math.max(0, Math.min(value, 1));
}
export function ProgressBar({
  value,
  label,
  className,
  tone = "primary",
}: {
  value: number;
  label: string;
  className?: string;
  tone?: keyof typeof colors;
}) {
  const percent = Math.round(fraction(value) * 100);
  return (
    <div
      className={classes(
        "h-2 w-full overflow-hidden rounded-full bg-surface-3",
        className,
      )}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={classes(
          "h-full rounded-full transition-[width] duration-500",
          colors[tone],
        )}
        style={{ width: percent + "%" }}
      />
    </div>
  );
}
export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  label,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  children: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction(value))}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold">
        {children}
      </span>
    </span>
  );
}
