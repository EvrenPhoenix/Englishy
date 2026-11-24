import { useTranslate, type MessageKey } from "../i18n/provider";

export function Placeholder({
  title,
  message,
}: {
  title?: string;
  message?: MessageKey;
}) {
  const t = useTranslate();
  return (
    <h1 className="text-2xl font-semibold tracking-tight">
      {message ? t(message) : title}
    </h1>
  );
}
