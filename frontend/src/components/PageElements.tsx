import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
export function classes(...values: (string | false | undefined)[]) {
  return values.filter(Boolean).join(" ");
}
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.15rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[1.02rem] text-muted">{subtitle}</p>
      </div>
    </header>
  );
}
const badgeTones = {
  primary: "bg-primary-soft text-primary-text",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  neutral: "bg-surface-2 text-muted",
};
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={classes(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}
export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
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
    </div>
  );
}
