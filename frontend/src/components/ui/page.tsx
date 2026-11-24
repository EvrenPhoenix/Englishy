import type { ReactNode } from "react";
import { classes } from "./classes";

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

export function Card({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return <div className={classes("card", className)}>{children}</div>;
}
