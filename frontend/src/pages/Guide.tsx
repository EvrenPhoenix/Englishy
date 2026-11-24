import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { BRAND } from "../../../shared/brand";
import { ActionLink } from "../components/ActionLink";
import { Brand } from "../components/Brand";
import { guides } from "../data/guides";
import type { Guide as GuideArticle } from "../data/types";
import { usePageMeta } from "../lib/use-page-meta";

function Article({ guide }: { guide: GuideArticle }) {
  return (
    <article className="mt-4">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {guide.title}
      </h1>
      <p className="mt-4 text-lg text-muted">{guide.intro}</p>
      {guide.sections.map((section) => (
        <section className="mt-8" key={section.heading}>
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-2 leading-relaxed">
              {text}
            </p>
          ))}
          {section.list && (
            <ul className="mt-3 list-disc space-y-1.5 ps-6">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <div className="mt-10 rounded-2xl bg-primary-soft p-6">
        <ActionLink to={guide.cta.to} arrow>
          {guide.cta.label}
        </ActionLink>
      </div>
      <nav
        aria-label="More guides"
        className="mt-10 border-t border-border pt-6"
      >
        <h2 className="font-semibold">More guides</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {guides
            .filter((item) => item.slug !== guide.slug)
            .map((item) => (
              <li key={item.slug}>
                <Link
                  className="text-primary-text hover:underline"
                  to={`/guides/${item.slug}`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </article>
  );
}

export function Guide() {
  const { slug = "" } = useParams(),
    guide = guides.find((item) => item.slug === slug);
  usePageMeta({
    title: guide?.title ?? "Guide not found",
    description: guide?.description,
    path: `/guides/${slug}`,
    noindex: !guide,
  });
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" aria-label={`${BRAND.name} home`}>
            <Brand />
          </Link>
          <ActionLink size="sm" to="/start">
            Start learning
          </ActionLink>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />{" "}
          Home
        </Link>
        {guide ? (
          <Article guide={guide} />
        ) : (
          <p className="mt-6">This guide does not exist.</p>
        )}
      </main>
    </div>
  );
}
