import type { ButtonHTMLAttributes, Ref } from "react";
import type { LucideIcon } from "lucide-react";
import { classes } from "./PageElements";
const tones = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary:
    "border border-border bg-surface text-text hover:border-border-strong hover:bg-surface-2",
  ghost: "text-text hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90 dark:text-[#2a0d0a]",
  dangerGhost: "text-danger hover:bg-danger-soft",
  soft: "bg-primary-soft text-primary-text hover:brightness-[0.97] dark:hover:brightness-110",
  subtle: "bg-surface-2 text-text hover:bg-surface-3",
};
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof tones;
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconEnd?: LucideIcon;
  ref?: Ref<HTMLButtonElement>;
};
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconEnd: End,
  children,
  className,
  ...props
}: ButtonProps) {
  const iconClass = (icon: LucideIcon) =>
    classes(
      "size-[1.1em] shrink-0",
      /Arrow(Left|Right)|Chevron(Left|Right)/.test(icon.displayName ?? "") &&
        "rtl:-scale-x-100",
    );
  const sizes =
    children || End
      ? {
          sm: "h-9 gap-1.5 px-3.5 text-sm",
          md: "h-11 gap-2 px-5 text-[0.95rem]",
          lg: "h-12 gap-2 px-6 text-base",
        }
      : { sm: "size-9", md: "size-11", lg: "size-12" };
  return (
    <button
      type="button"
      className={classes(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,opacity,transform,filter] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        tones[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden className={iconClass(Icon)} />}
      {children}
      {End && <End aria-hidden className={iconClass(End)} />}
    </button>
  );
}
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
