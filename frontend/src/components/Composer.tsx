import * as React from "react";
import { ArrowUp, Square, type LucideIcon } from "lucide-react";
import { classes } from "./PageElements";
import { useTranslate } from "../i18n/provider";
interface Props {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  busy?: boolean;
  disabled?: boolean;
  label: string;
  placeholder: string;
  maxLength: number;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
  size?: "md" | "lg";
  className?: string;
  inputLang?: string;
  focusSignal?: number;
}
export function Suggestion({
  icon: Icon,
  children,
  onClick,
  disabled,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text/90 transition-colors hover:border-border-strong hover:bg-surface-2 disabled:opacity-50"
    >
      {Icon && (
        <Icon aria-hidden className="size-4 shrink-0 text-primary-text" />
      )}
      <span className="text-start">{children}</span>
    </button>
  );
}
export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy = false,
  disabled = false,
  label,
  placeholder,
  maxLength,
  leading,
  trailing,
  autoFocus,
  size = "md",
  className,
  inputLang,
  focusSignal,
}: Props) {
  const t = useTranslate();
  const id = React.useId();
  const textarea = React.useRef<HTMLTextAreaElement>(null);
  const tooLong = value.length > maxLength;
  const canSend = !disabled && !busy && value.trim().length > 0 && !tooLong;
  const showCount = value.length > maxLength * 0.8;
  React.useLayoutEffect(() => {
    const input = textarea.current;
    input &&
      ((input.style.height = "auto"),
      (input.style.height = `${Math.min(input.scrollHeight, size === "lg" ? 240 : 200)}px`));
  }, [value, size, placeholder]);
  React.useEffect(() => {
    const input = textarea.current;
    focusSignal &&
      input &&
      (input.focus(),
      input.setSelectionRange(input.value.length, input.value.length));
  }, [focusSignal]);
  React.useEffect(() => {
    autoFocus &&
      window.matchMedia?.("(pointer: fine)").matches &&
      textarea.current?.focus({
        preventScroll: true,
      });
  }, [autoFocus]);
  return (
    <form
      className={classes(
        "relative rounded-[1.75rem] border border-border bg-surface shadow-card transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_1px_var(--primary)]",
        size === "lg" ? "p-2.5 sm:p-3" : "p-2",
        className,
      )}
      onSubmit={(event) => {
        (event.preventDefault(), canSend && onSubmit());
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        ref={textarea}
        data-composer={true}
        value={value}
        lang={inputLang}
        dir="auto"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing &&
            (event.preventDefault(), canSend && onSubmit());
        }}
        rows={1}
        maxLength={maxLength + 200}
        placeholder={placeholder}
        aria-invalid={tooLong || undefined}
        aria-describedby={showCount ? `${id}-count` : undefined}
        className={classes(
          "block w-full resize-none bg-transparent px-3 text-text outline-none placeholder:text-muted",
          size === "lg" ? "min-h-14 pt-2.5 text-[1.05rem]" : "min-h-11 pt-2",
        )}
      />
      <div className="flex items-center gap-1.5 px-1 pt-1">
        <div className="flex min-w-0 flex-1 items-center gap-1">{leading}</div>
        {showCount && (
          <span
            id={`${id}-count`}
            className={classes(
              "px-1 text-xs tabular-nums",
              tooLong ? "font-semibold text-danger" : "text-muted",
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
        {trailing}
        {busy && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t("chat.stop")}
            title={t("chat.stop")}
            className="grid size-10 place-items-center rounded-full bg-text text-bg transition-transform active:scale-95"
          >
            <Square className="size-3.5 fill-current" aria-hidden={true} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("chat.send")}
            title={t("chat.send")}
            className={classes(
              "grid size-10 place-items-center rounded-full transition-[background-color,transform] active:scale-95",
              canSend
                ? "bg-primary text-on-primary hover:bg-primary-hover"
                : "bg-surface-3 text-muted",
            )}
          >
            <ArrowUp className="size-5" aria-hidden={true} />
          </button>
        )}
      </div>
    </form>
  );
}
