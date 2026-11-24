import { Fragment, type ReactNode } from "react";

/** Renders **bold** and *italic* markers used in lesson and grammar text. */
export function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{parse(text)}</span>;
}

function parse(text: string) {
  const out: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0,
    key = 0,
    match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last)
      out.push(
        <Fragment key={key++}>{text.slice(last, match.index)}</Fragment>,
      );
    out.push(
      match[1] ? (
        <strong key={key++} className="font-semibold text-primary-text">
          {match[1]}
        </strong>
      ) : (
        <em key={key++}>{match[2]}</em>
      ),
    );
    last = match.index + match[0].length;
  }
  if (last < text.length)
    out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return out;
}
