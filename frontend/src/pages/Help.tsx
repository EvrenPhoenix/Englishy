import { Fragment, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { BRAND } from "../../../shared/brand";
import { helpArticles } from "../data/catalogues";
import { useTranslate } from "../i18n/provider";
import { useAiStatus } from "../lib/use-ai-status";
import { usePageMeta } from "../lib/use-page-meta";

const sectionLinks = [
  ["start", "Getting started"],
  ["ai", "AI features"],
  ["offline", "Offline use"],
  ["privacy", "Privacy"],
  ["accessibility", "Accessibility"],
  ["about", "About"],
] as const;

type Status = "loading" | "online" | "offline";
type Content =
  | string
  | readonly Content[]
  | { statusText: Record<Status, string> }
  | { tag: "link"; to: string; children: Content }
  | { tag: "p" | "ul" | "li" | "kbd" | "strong"; children: Content };

function isList(node: Content): node is readonly Content[] {
  return Array.isArray(node);
}
function articleText(node: Content, status: Status): ReactNode {
  if (typeof node === "string") return node;
  if (isList(node))
    return node.map((item, index) => (
      <Fragment key={index}>{articleText(item, status)}</Fragment>
    ));
  if ("statusText" in node) return node.statusText[status];
  const children = articleText(node.children, status);
  if (node.tag === "link")
    return (
      <Link className="text-primary-text underline" to={node.to}>
        {children}
      </Link>
    );
  if (node.tag === "kbd")
    return <kbd className="rounded border border-border px-1">{children}</kbd>;
  const Tag = node.tag;
  return <Tag>{children}</Tag>;
}

export function Help() {
  const t = useTranslate(),
    status = useAiStatus(),
    { hash } = useLocation();
  const title = t("nav.help");
  usePageMeta({
    title,
    description: `How ${BRAND.name} works, what data is stored, accessibility features and AI limitations.`,
    path: "/help",
  });
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(hash.slice(1))?.scrollIntoView(),
    );
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  const availability =
    status === undefined ? "loading" : status.available ? "online" : "offline";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.15rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-[1.02rem] text-muted">
            {`How ${BRAND.name} works, what happens to your data, and what to expect from the AI.`}
          </p>
        </div>
      </header>
      <nav aria-label="On this page" className="flex flex-wrap gap-2 text-sm">
        {sectionLinks.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-border bg-surface px-3 py-1 hover:bg-surface-2"
          >
            {label}
          </a>
        ))}
      </nav>
      {helpArticles.map(({ id, title, children }) => (
        <section
          key={id}
          id={id}
          aria-labelledby={`${id}-h`}
          className="card scroll-mt-24 p-5 sm:p-6"
        >
          <h2 id={`${id}-h`} className="text-lg font-semibold">
            {title}
          </h2>
          <div
            className={`mt-3 space-y-3 leading-relaxed [&_li]:ms-5 [&_li]:list-disc [&_ul]:space-y-1.5 ${id === "privacy" || id === "accessibility" ? "[&>p:last-child]:text-sm [&>p:last-child]:text-muted" : ""}`}
          >
            {articleText(children, availability)}
          </div>
        </section>
      ))}
    </div>
  );
}
