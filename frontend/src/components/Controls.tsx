import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  CircleCheck,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { classes } from "./PageElements";

const noticeTones = {
  info: { box: "bg-indigo-soft", icon: Info, text: "text-indigo" },
  warning: {
    box: "bg-warning-soft",
    icon: TriangleAlert,
    text: "text-warning",
  },
  danger: { box: "bg-danger-soft", icon: TriangleAlert, text: "text-danger" },
  success: { box: "bg-success-soft", icon: CircleCheck, text: "text-success" },
};

/** Tinted message box used for statuses, errors and confirmations. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  icon,
}: {
  tone?: keyof typeof noticeTones;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  const style = noticeTones[tone];
  const Icon = icon ?? style.icon;
  return (
    <div
      className={classes("flex gap-3 rounded-2xl p-4 text-sm", style.box)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon
        aria-hidden
        className={classes("mt-0.5 size-5 shrink-0", style.text)}
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={classes(Boolean(title) && "mt-0.5", "text-text/90")}>
          {children}
        </div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

/** Native modal dialog. Content only mounts while open. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-3xl border border-border bg-raised p-0 text-text shadow-raised backdrop:bg-black/45 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-m-1.5 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="text-[0.95rem] text-text/90">{children}</div>
          {footer && (
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
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
