import { useEffect, useId, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import {
  ChevronsUpDown,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  Sun,
  X,
} from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { LEVEL_LABELS } from "../../../shared/constants";
import { useTranslate } from "../i18n/provider";
import { minutesToday, recentTutorChats, subscribe } from "../lib/database";
import { Brand } from "./Brand";
import { usePreferences } from "./PreferencesProvider";
import {
  accountLinks,
  aiLinks,
  learnLinks,
  navItems,
  type Destination,
} from "./navigation";

function useStoredValue<T>(store: string, read: () => Promise<T>, initial: T) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    let revision = 0;
    async function refresh() {
      const current = ++revision;
      const next = await read();
      if (revision === current) setValue(next);
    }
    void refresh();
    const unsubscribe = subscribe(store, refresh);
    return () => {
      revision++;
      unsubscribe();
    };
  }, [read, store]);
  return value;
}

export function NewChat({
  compact = false,
  header = false,
  onNavigate,
}: {
  compact?: boolean;
  header?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslate();
  const navigate = useNavigate();
  return (
    <Link
      to="/tutor?new=1"
      aria-label={t("nav.newChat")}
      title={compact || header ? t("nav.newChat") : undefined}
      className={
        header
          ? "grid size-11 place-items-center rounded-full hover:bg-surface-2"
          : `flex h-11 items-center gap-3 rounded-full bg-surface font-medium shadow-card ring-1 ring-border hover:bg-surface-2 ${compact ? "w-11 justify-center" : "px-4"}`
      }
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
          return;
        e.preventDefault();
        void navigate(`/tutor?new=${Date.now().toString(36)}`);
        onNavigate?.();
      }}
    >
      <SquarePen
        aria-hidden="true"
        className={
          header ? "size-5" : "size-[1.15rem] shrink-0 text-primary-text"
        }
      />
      {!header && (
        <span className={compact ? "sr-only" : "text-[0.94rem]"}>
          {t("nav.newChat")}
        </span>
      )}
    </Link>
  );
}

function Links({
  items,
  compact,
  onNavigate,
}: {
  items: Destination[];
  compact: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslate();
  return (
    <ul className="space-y-0.5">
      {items.map((id) => {
        const Icon = navItems[id],
          label = t(`nav.${id}`);
        return (
          <li key={id}>
            <NavLink
              to={`/${id}`}
              end={id === "home"}
              onClick={onNavigate}
              title={compact ? label : undefined}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-full text-[0.94rem] transition-colors ${compact ? "w-10 justify-center" : "px-3.5"} ${isActive ? "bg-primary-soft font-medium text-primary-text" : "text-text/85 hover:bg-surface-3/70 hover:text-text"}`
              }
            >
              <Icon className="size-[1.2rem] shrink-0" aria-hidden="true" />
              <span className={compact ? "sr-only" : "truncate"}>{label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

function RecentChats({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslate();
  const { prefs } = usePreferences();
  const rows = useStoredValue("conversations", recentTutorChats, []);
  const { pathname } = useLocation(),
    [query] = useSearchParams();
  if (!prefs.saveConversations || !rows.length) return null;
  return (
    <nav aria-label={t("nav.recentChats")} className="mt-6">
      <h2 className="px-3.5 pb-1.5 text-xs font-medium text-muted">
        {t("nav.recentChats")}
      </h2>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to={`/tutor?c=${encodeURIComponent(row.id)}`}
              onClick={onNavigate}
              aria-current={
                pathname === "/tutor" && query.get("c") === row.id
                  ? "page"
                  : undefined
              }
              className="block truncate rounded-full px-3.5 py-2 text-sm text-text/80 hover:bg-surface-3/70 aria-[current=page]:bg-surface-3 aria-[current=page]:font-medium"
            >
              {row.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ThemeToggle() {
  const t = useTranslate(),
    { prefs, update } = usePreferences();
  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label")}
      className="inline-flex gap-0.5 rounded-full bg-surface-2 p-1"
    >
      {(["light", "dark", "system"] as const).map((theme) => {
        const Icon = { light: Sun, dark: Moon, system: Monitor }[theme];
        return (
          <button
            type="button"
            role="radio"
            key={theme}
            aria-label={t(`theme.${theme}`)}
            title={t(`theme.${theme}`)}
            aria-checked={prefs.theme === theme}
            onClick={() => void update({ theme })}
            className="inline-flex h-8 items-center justify-center rounded-full px-2.5 text-muted aria-checked:bg-raised aria-checked:text-text aria-checked:shadow-sm"
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

function ProfileMenu({
  compact,
  onNavigate,
}: {
  compact: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslate(),
    { prefs } = usePreferences();
  const minutes = useStoredValue("activities", minutesToday, 0);
  const [open, setOpen] = useState(false),
    panel = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null),
    id = useId();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
        e.stopPropagation();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={panel} className="relative">
      {open && (
        <div
          id={id}
          className="animate-pop absolute start-0 bottom-full z-40 mb-2 w-64 rounded-2xl border border-border bg-raised p-1.5 shadow-raised"
        >
          <Links items={accountLinks} compact={false} onNavigate={onNavigate} />
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border px-2 pt-2.5 pb-1">
            <span className="text-sm text-muted">{t("theme.label")}</span>
            <ThemeToggle />
          </div>
        </div>
      )}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title={compact ? t("nav.youMenu") : undefined}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-2xl text-start hover:bg-surface-3/70 ${compact ? "justify-center p-1" : "p-2"}`}
      >
        <span
          aria-hidden="true"
          className="relative grid size-[38px] shrink-0 place-items-center text-[0.68rem] font-semibold"
        >
          <svg
            viewBox="0 0 38 38"
            className="absolute inset-0 -rotate-90 fill-none"
            strokeWidth="3.5"
          >
            <circle cx="19" cy="19" r="17" stroke="var(--surface-3)" />
            <circle
              cx="19"
              cy="19"
              r="17"
              stroke="var(--primary)"
              pathLength="1"
              strokeDasharray={`${Math.min(1, minutes / prefs.dailyGoalMinutes)} 1`}
              strokeLinecap="round"
            />
          </svg>
          {LEVEL_LABELS[prefs.level].code}
        </span>
        <span className={compact ? "sr-only" : "min-w-0 flex-1"}>
          <span className="block truncate text-sm font-medium">
            {t(`level.${prefs.level}`)}
          </span>
          <span className="block truncate text-xs text-muted">
            {t("dashboard.goalProgress", {
              done: minutes,
              goal: prefs.dailyGoalMinutes,
            })}
          </span>
          <span className="sr-only">{t("nav.youMenu")}</span>
        </span>
        {!compact && (
          <ChevronsUpDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted"
          />
        )}
      </button>
    </div>
  );
}

export function Sidebar({
  compact = false,
  onToggle,
  onClose,
}: {
  compact?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslate(),
    ToggleIcon = compact ? PanelLeftOpen : PanelLeftClose;
  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-16 shrink-0 items-center ${compact ? "justify-center" : "justify-between ps-5 pe-3"}`}
      >
        {!compact && (
          <Link
            to="/home"
            onClick={onClose}
            className="rounded-lg"
            aria-label={`${BRAND.name}, ${t("nav.home")}`}
          >
            <Brand />
          </Link>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={t(compact ? "nav.expand" : "nav.collapse")}
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-3/70"
          >
            <ToggleIcon className="size-5 rtl:-scale-x-100" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={t("nav.close")}
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-3/70"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      <div
        className={`shrink-0 pb-3 ${compact ? "flex justify-center" : "px-3"}`}
      >
        <NewChat compact={compact} onNavigate={onClose} />
      </div>
      <div
        className={`min-h-0 flex-1 overflow-y-auto pb-4 ${compact ? "px-3.5" : "px-3"}`}
      >
        <nav aria-label={t("nav.menu")}>
          <Links items={learnLinks} compact={compact} onNavigate={onClose} />
          {compact ? (
            <div
              aria-hidden="true"
              className="mx-auto my-3 h-px w-6 bg-border"
            />
          ) : (
            <p
              aria-hidden="true"
              className="px-3.5 pt-5 pb-1.5 text-xs font-medium text-muted"
            >
              {t("nav.aiPractice")}
            </p>
          )}
          <Links items={aiLinks} compact={compact} onNavigate={onClose} />
        </nav>
        {!compact && <RecentChats onNavigate={onClose} />}
      </div>
      <div className="shrink-0 border-t border-border/70 p-2">
        <ProfileMenu compact={compact} onNavigate={onClose} />
      </div>
    </div>
  );
}
