import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { classes } from "./classes";

export function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon: Icon,
  multi,
  lang,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  multi?: boolean;
  lang?: string;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={classes(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition-colors",
        selected
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
      )}
    >
      {Icon && (
        <span
          aria-hidden
          className={classes(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            selected ? "bg-primary text-on-primary" : "bg-surface-2 text-muted",
          )}
        >
          <Icon className="size-4.5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span lang={lang} className="block font-medium">
          {title}
        </span>
        {description && (
          <span className="mt-0.5 block text-sm text-muted">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={classes(
          "mt-0.5 grid size-5 shrink-0 place-items-center border-2",
          multi ? "rounded-md" : "rounded-full",
          selected
            ? "border-primary bg-primary text-on-primary"
            : "border-border-strong",
        )}
      >
        {selected &&
          (multi ? (
            <svg viewBox="0 0 12 12" className="size-3">
              <path
                d="M2 6.5 5 9l5-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <span className="size-2 rounded-full bg-current" />
          ))}
      </span>
    </button>
  );
}

/** Labelled on/off switch row. */
export function SwitchRow({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  id?: string;
}) {
  const generated = useId();
  const switchId = id ?? generated;
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <label htmlFor={switchId} className="min-w-0 cursor-pointer">
        <span className="block font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-sm text-muted">{description}</span>
        )}
      </label>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={classes(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors",
          checked
            ? "bg-primary"
            : "bg-surface-3 ring-1 ring-border-strong ring-inset",
        )}
      >
        <span
          className={classes(
            "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200",
            checked ? "start-6" : "start-1",
          )}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

/** Labelled native select. */
export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  description,
}: {
  label: ReactNode;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  description?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="py-4">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {description && (
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      )}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2.5 h-11 w-full max-w-sm rounded-xl border border-border bg-surface px-3 text-[0.95rem] hover:border-border-strong"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface SegmentOption<T> {
  value: T;
  label?: ReactNode;
  icon?: LucideIcon;
  ariaLabel?: string;
}

/** Pill-shaped single-choice control. */
export function Segmented<T extends string | number>({
  label,
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={classes(
        "inline-flex gap-0.5 rounded-full bg-surface-2 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            title={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={classes(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              selected
                ? "bg-raised text-text shadow-sm ring-1 ring-border"
                : "text-muted hover:text-text",
            )}
          >
            {Icon && (
              <Icon
                aria-hidden
                className={size === "sm" ? "size-3.5" : "size-4"}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
