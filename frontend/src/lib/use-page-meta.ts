import { useEffect } from "react";
import { BRAND } from "../../../shared/brand";

interface PageMeta {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
}

export function usePageMeta({
  title,
  description = BRAND.description,
  path,
  noindex = false,
}: PageMeta) {
  useEffect(() => {
    document.title = title
      ? `${title} · ${BRAND.name}`
      : `${BRAND.name} · ${BRAND.tagline}`;
    const head = document.head;
    head.querySelector<HTMLMetaElement>('meta[name="description"]')!.content =
      description;
    head.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content =
      title ?? BRAND.name;
    head.querySelector<HTMLMetaElement>(
      'meta[property="og:description"]',
    )!.content = description;
    head.querySelector<HTMLMetaElement>('meta[name="robots"]')!.content =
      noindex ? "noindex, nofollow" : "index, follow";
    if (path !== undefined)
      head.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href =
        BRAND.defaultSiteUrl + path;
  }, [title, description, path, noindex]);
}
