import { Link, type LinkProps } from "react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";

type Props = LinkProps & {
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
};

export function ActionLink({
  size = "md",
  arrow,
  icon: Icon,
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      className={`inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,opacity,transform,filter] duration-150 ${variant === "primary" ? "bg-primary text-on-primary hover:bg-primary-hover" : "border border-border bg-surface text-text hover:border-border-strong hover:bg-surface-2"} active:scale-[0.98] ${size === "sm" ? "h-9 gap-1.5 px-3.5 text-sm" : size === "lg" ? "h-12 gap-2 px-6 text-base" : "h-11 gap-2 px-5 text-[0.95rem]"} ${className}`}
    >
      {Icon && <Icon aria-hidden="true" className="size-[1.1em] shrink-0" />}
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden="true"
          className="size-[1.1em] shrink-0 rtl:-scale-x-100"
        />
      )}
    </Link>
  );
}
