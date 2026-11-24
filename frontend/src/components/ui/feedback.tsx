import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  CircleCheck,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { classes } from "./classes";

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

const badgeTones = {
  primary: "bg-primary-soft text-primary-text",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  neutral: "bg-surface-2 text-muted",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  indigo: "bg-indigo-soft text-indigo",
};

export function Badge({
  icon: Icon,
  tone = "neutral",
  className,
  children,
}: {
  icon?: LucideIcon;
  tone?: keyof typeof badgeTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={classes(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-strong px-6 py-12 text-center">
      <span
        className="mb-3 grid size-12 place-items-center rounded-full bg-surface-2 text-muted"
        aria-hidden
      >
        <Icon className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      <div className="mt-1 max-w-md text-sm text-muted">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
