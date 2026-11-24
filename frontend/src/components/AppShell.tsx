import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Menu, WifiOff } from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { useTranslate } from "../i18n/provider";
import { readString, storageKeys, writeString } from "../lib/storage-keys";
import { usePreferences } from "./PreferencesProvider";
import { Brand } from "./Brand";
import { NewChat, Sidebar } from "./Sidebar";
import { bottomLinks, navItems } from "./navigation";

function MobileNavigation() {
  const t = useTranslate();
  return (
    <nav
      aria-label={t("nav.menu")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {bottomLinks.map((id) => {
          const Icon = navItems[id];
          return (
            <li key={id}>
              <NavLink
                end={id === "home"}
                to={`/${id}`}
                className="group flex flex-col items-center gap-1 pt-2 pb-2.5 text-[0.72rem] font-medium text-muted aria-[current=page]:text-text"
              >
                <span className="grid h-8 w-14 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-primary-soft group-aria-[current=page]:text-primary-text">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="max-w-full truncate px-1">
                  {t(`nav.${id}`)}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell() {
  const t = useTranslate(),
    { persistent } = usePreferences(),
    { pathname, search } = useLocation();
  const [compact, setCompact] = useState(
    () => readString(storageKeys.sidebar) === "collapsed",
  );
  const [drawer, setDrawer] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const dialog = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null);
  const chat =
    pathname === "/tutor" || /^\/conversation\/[^/]+$/.test(pathname);
  const bottom = !chat && !/^\/learn\/[^/]+$/.test(pathname);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => setDrawer(false), [pathname, search]);
  useEffect(() => {
    if (drawer && !dialog.current?.open) dialog.current?.showModal();
    if (!drawer && dialog.current?.open) dialog.current.close();
  }, [drawer]);
  useEffect(() => {
    if (!main.current?.contains(document.activeElement))
      main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);
  function toggleSidebar() {
    writeString(storageKeys.sidebar, compact ? "open" : "collapsed");
    setCompact(!compact);
  }
  return (
    <div className="flex min-h-dvh bg-bg">
      <a
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
        href="#main"
      >
        {t("app.skip")}
      </a>
      <aside
        className={`sticky top-0 z-30 hidden h-dvh shrink-0 bg-sidebar transition-[width] duration-200 lg:block ${compact ? "w-[4.75rem]" : "w-68"}`}
      >
        <Sidebar compact={compact} onToggle={toggleSidebar} />
      </aside>
      <dialog
        ref={dialog}
        aria-label={t("nav.menu")}
        onClose={() => setDrawer(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDrawer(false);
        }}
        className="animate-slide-in-start m-0 h-dvh max-h-dvh w-[min(86vw,20rem)] max-w-none bg-sidebar p-0 text-text backdrop:bg-black/40 lg:hidden"
      >
        {drawer && <Sidebar onClose={() => setDrawer(false)} />}
      </dialog>
      <div className={`flex min-w-0 flex-1 flex-col ${chat ? "h-dvh" : ""}`}>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 bg-bg/90 px-2 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={t("nav.openMenu")}
            aria-expanded={drawer}
            className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
          >
            <Menu className="size-5.5" />
          </button>
          <Link to="/home" aria-label={`${BRAND.name}, ${t("nav.home")}`}>
            <Brand small />
          </Link>
          <NewChat header />
        </header>
        {(!online || !persistent) && (
          <div className="flex shrink-0 flex-col items-center gap-2 px-4 pt-3">
            {!online && (
              <div
                role="status"
                className="flex max-w-2xl items-center gap-2 rounded-full bg-warning-soft px-4 py-2 text-sm"
              >
                <WifiOff className="size-4 text-warning" />
                {t("app.offline")}
              </div>
            )}
            {!persistent && (
              <div
                role="status"
                className="max-w-2xl rounded-2xl bg-warning-soft px-4 py-2 text-sm"
              >
                {t("app.storageUnavailable")}
              </div>
            )}
          </div>
        )}
        <main
          id="main"
          ref={main}
          tabIndex={-1}
          className={`outline-none ${chat ? "min-h-0 flex-1" : "mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10"} ${chat ? "" : bottom ? "pb-28 lg:pb-16" : "pb-12"}`}
        >
          <Outlet />
        </main>
      </div>
      {bottom && <MobileNavigation />}
    </div>
  );
}
