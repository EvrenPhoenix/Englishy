import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useTranslate } from "../i18n/provider";
import { classes } from "./PageElements";
export function TutorMark({
  className = "size-8",
  pulse,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={classes(
        "bg-brand-mark grid shrink-0 place-items-center rounded-full text-white",
        pulse && "animate-pulse-ring",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[55%]">
        <path
          d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5v-6A2.5 2.5 0 0 1 6.5 5Z"
          fill="currentColor"
        />
        <path
          d="M8.5 8.6h7M8.5 10.6h4.6M8.5 12.6h7"
          stroke="#0f766e"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
export function TutorMessage({
  name,
  actions,
  className,
  children,
}: {
  name?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={classes("group flex gap-3 sm:gap-4", className)}>
      <TutorMark className="mt-0.5 size-8" />
      <div className="min-w-0 flex-1">
        {name && <p className="mb-0.5 text-sm font-semibold">{name}</p>}
        <div className="leading-relaxed">{children}</div>
        {actions && (
          <div className="mt-1.5 -ms-2 flex flex-wrap items-center gap-0.5 text-muted">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
export function LearnerBubble({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-end">
      <div
        dir="auto"
        className="max-w-[85%] rounded-3xl rounded-ee-lg bg-surface-2 px-4 py-2.5 break-words whitespace-pre-wrap sm:max-w-[75%]"
      >
        {children}
      </div>
      {footer}
    </div>
  );
}

/** Small icon button under a message (copy, listen, regenerate…). */
export function ChatAction({
  icon: Icon,
  label,
  onClick,
  active,
  showLabel,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={showLabel ? undefined : label}
      title={label}
      className={classes(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs hover:bg-surface-2 hover:text-text",
        active && "text-primary-text",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {showLabel && <span>{label}</span>}
    </button>
  );
}

/** Three animated dots while the tutor is writing. */
export function TypingIndicator() {
  const t = useTranslate();
  return (
    <span
      className="flex items-center gap-1 py-2"
      role="status"
      aria-label={t("chat.typing")}
    >
      <span className="typing-dot size-2 rounded-full bg-muted" />
      <span className="typing-dot size-2 rounded-full bg-muted" />
      <span className="typing-dot size-2 rounded-full bg-muted" />
    </span>
  );
}
