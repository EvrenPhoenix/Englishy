import * as React from "react";
import type { DayTotal } from "../lib/progress-stats";
export function ActivityChart({
  days,
  goal,
}: {
  days: DayTotal[];
  goal: number;
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [showTable, setShowTable] = React.useState(false);
  const maximumMinutes = Math.max(goal, ...days.map((day) => day.minutes), 5);
  const scaleMax = Math.ceil(maximumMinutes / 5) * 5;
  const columnWidth = 600 / days.length;
  const barWidth = Math.max(6, Math.min(26, columnWidth - 2));
  const yAt = (minutes: number) => 174 - (minutes / scaleMax) * 164;
  const ticks = [0, scaleMax / 2, scaleMax];
  const dayLabel = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          className="text-sm text-primary-text hover:underline"
          onClick={() => setShowTable(!showTable)}
          aria-pressed={showTable}
        >
          {showTable ? "Show chart" : "Show as table"}
        </button>
      </div>
      {showTable ? (
        <table className="w-full text-sm">
          <caption className="sr-only">Minutes learned per day</caption>
          <thead>
            <tr className="text-muted">
              <th className="py-1 text-start font-medium">Day</th>
              <th className="py-1 text-end font-medium">Minutes</th>
              <th className="py-1 text-end font-medium">Activities</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.day} className="border-t border-border">
                <td className="py-1.5">{dayLabel(day.day)}</td>
                <td className="py-1.5 text-end tabular-nums">{day.minutes}</td>
                <td className="py-1.5 text-end tabular-nums">
                  {day.activities}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg
            viewBox="0 0 640 200"
            className="h-auto w-full"
            role="img"
            aria-label={`Bar chart of minutes learned per day for the last ${days.length} days. Use "Show as table" for exact values.`}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={32}
                  x2={632}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={26}
                  y={yAt(tick) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--muted)"
                >
                  {tick}
                </text>
              </g>
            ))}
            {goal <= scaleMax && (
              <g>
                <line
                  x1={32}
                  x2={632}
                  y1={yAt(goal)}
                  y2={yAt(goal)}
                  stroke="var(--muted)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={630}
                  y={yAt(goal) < 22 ? yAt(goal) + 14 : yAt(goal) - 5}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--muted)"
                >
                  {"goal "}
                  {goal}
                  {" min"}
                </text>
              </g>
            )}
            {days.map((day, index) => {
              const center = 32 + columnWidth * index + columnWidth / 2;
              const height = Math.max(0, yAt(0) - yAt(day.minutes));
              const top = yAt(0) - height;
              const radius = Math.min(4, height / 2, barWidth / 2);
              const barPath =
                height > 0
                  ? `M${center - barWidth / 2},${yAt(0)} V${top + radius} Q${center - barWidth / 2},${top} ${center - barWidth / 2 + radius},${top} H${center + barWidth / 2 - radius} Q${center + barWidth / 2},${top} ${center + barWidth / 2},${top + radius} V${yAt(0)} Z`
                  : "";
              const showLabel =
                index % 2 === (days.length - 1) % 2 || days.length <= 7;
              return (
                <g
                  key={day.day}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${dayLabel(day.day)}: ${day.minutes} minutes`}
                >
                  <rect
                    x={32 + columnWidth * index}
                    y={10}
                    width={columnWidth}
                    height={164}
                    fill={
                      activeIndex === index ? "var(--surface-2)" : "transparent"
                    }
                  />
                  {barPath && (
                    <path
                      d={barPath}
                      fill="var(--chart-1)"
                      opacity={
                        activeIndex === null || activeIndex === index ? 1 : 0.55
                      }
                    />
                  )}
                  {showLabel && (
                    <text
                      x={center}
                      y={192}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--muted)"
                    >
                      {new Date(`${day.day}T12:00:00`).toLocaleDateString(
                        undefined,
                        {
                          weekday: "narrow",
                        },
                      )}
                    </text>
                  )}
                </g>
              );
            })}
            <line
              x1={32}
              x2={632}
              y1={yAt(0)}
              y2={yAt(0)}
              stroke="var(--border-strong)"
              strokeWidth={1}
            />
          </svg>
          {activeIndex !== null && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-raised"
              style={{
                left: `${((32 + columnWidth * activeIndex + columnWidth / 2) / 640) * 100}%`,
                top: 0,
              }}
              role="status"
            >
              <p className="font-medium">{dayLabel(days[activeIndex].day)}</p>
              <p className="text-muted">
                {days[activeIndex].minutes}
                {" min · "}
                {days[activeIndex].activities}
                {" activit"}
                {days[activeIndex].activities === 1 ? "y" : "ies"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
