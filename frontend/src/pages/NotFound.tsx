import { Compass } from "lucide-react";
import { ButtonLink } from "../components/ui";
import { useTranslate } from "../i18n/provider";
import { usePageMeta } from "../lib/use-page-meta";

export function NotFound() {
  const t = useTranslate();
  usePageMeta({ title: t("notFound.title"), noindex: true });
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-strong px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="mb-3 grid size-12 place-items-center rounded-full bg-surface-2 text-muted"
        >
          <Compass className="size-6" />
        </span>
        <p className="font-semibold">{t("notFound.title")}</p>
        <div className="mt-1 max-w-md text-sm text-muted">
          {t("notFound.body")}
        </div>
        <div className="mt-5">
          <ButtonLink to="/home">{t("nav.home")}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
