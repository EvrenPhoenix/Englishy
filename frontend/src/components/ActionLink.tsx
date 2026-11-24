import { Link, type LinkProps } from "react-router";
import { ArrowRight } from "lucide-react";

type Props = LinkProps & { size?: "sm" | "md"; arrow?: boolean };

export function ActionLink({ size = "md", arrow, children, ...props }: Props) {
  return (
    <Link
      {...props}
      className={`inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full bg-primary font-medium text-on-primary transition-[background-color,border-color,color,opacity,transform,filter] duration-150 hover:bg-primary-hover active:scale-[0.98] ${size === "sm" ? "h-9 gap-1.5 px-3.5 text-sm" : "h-11 gap-2 px-5 text-[0.95rem]"}`}
    >
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
