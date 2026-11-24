import type { ButtonHTMLAttributes, Ref } from "react";
import { Link, type LinkProps } from "react-router";
import type { LucideIcon } from "lucide-react";
import { classes } from "./classes";

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

/** A link styled exactly like Button. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconEnd: End,
  children,
  className,
  ...props
}: LinkProps & {
  variant?: keyof typeof tones;
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconEnd?: LucideIcon;
}) {
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
    <Link
      className={classes(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,opacity,transform,filter] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        tones[variant],
        sizes[size],
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden className={iconClass(Icon)} />}
      {children}
      {End && <End aria-hidden className={iconClass(End)} />}
    </Link>
  );
}
