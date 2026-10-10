"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Search,
  Settings,
  Share,
  Smartphone,
  Star,
  Sun,
} from "lucide-react";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ThemeColorSync } from "@/components/ThemeColorSync";
import { useNav } from "@/components/nav-context";
import { primaryTabFromPathname, titleFromPathname } from "@/lib/nav";
import {
  canNativeInstall,
  isIosDevice,
  isStandaloneDisplay,
  promptNativeInstall,
  subscribeInstall,
  wasInstallDismissed,
} from "@/lib/pwa-install";
import {
  persistThemeMode,
  readStoredTheme,
  subscribeTheme,
  themeLabel,
  type ThemeMode,
} from "@/lib/theme";

const TABS = [
  { id: "inicio", href: "/", label: "Inicio", icon: Home },
  { id: "agenda", href: "/agenda", label: "Agenda", icon: CalendarDays },
  { id: "buscar", href: "/buscar", label: "Buscar", icon: Search },
  { id: "guardados", href: "/favoritos", label: "Guardados", icon: Star },
] as const;

const LEFT_TABS = [
  { id: "agenda", href: "/agenda", label: "Agenda", icon: CalendarDays },
  { id: "buscar", href: "/buscar", label: "Buscar", icon: Search },
] as const;

const RIGHT_TABS = [
  { id: "guardados", href: "/favoritos", label: "Guardados", icon: Star },
] as const;

const MORE_LINKS = [
  { href: "/pedidos", label: "Pedidos", icon: MessageSquare, badge: true },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3, badge: false },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell, badge: false },
  { href: "/ajustes", label: "Ajustes", icon: Settings, badge: false },
] as const;

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname() || "/";
  const { title, searchOpen, setSearchOpen, unreadPedidos } = useNav();
  const [compact, setCompact] = useState(false);
  const [hideBar, setHideBar] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const heading = title ?? titleFromPathname(pathname);
  const activeTab = primaryTabFromPathname(pathname);

  function closeMore() {
    document.getElementById("more-menu")?.hidePopover();
    setMoreOpen(false);
  }

  useEffect(() => {
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setCompact(y > 24);
      if (moreOpen || searchOpen) {
        setHideBar(false);
        last = y;
        return;
      }
      if (y > last + 10 && y > 64) setHideBar(true);
      else if (y < last - 8) setHideBar(false);
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [moreOpen, searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname, setSearchOpen]);

  useEffect(() => {
    const sheet = document.getElementById("more-menu");
    if (!sheet) return;
    function onToggle(event: Event) {
      setMoreOpen((event as ToggleEvent).newState === "open");
    }
    sheet.addEventListener("toggle", onToggle);
    return () => sheet.removeEventListener("toggle", onToggle);
  }, []);

  return (
    <>
      <ThemeColorSync />
      <SearchOverlay />
      <DesktopSidebar email={email} pathname={pathname} unread={unreadPedidos} />
      <MobileHeader title={heading} compact={compact} />
      <MobileTabBar
        activeTab={activeTab}
        hidden={hideBar}
        unread={unreadPedidos}
        moreOpen={moreOpen}
      />
      <MoreSheet
        email={email}
        unread={unreadPedidos}
        pathname={pathname}
        onClose={closeMore}
      />
    </>
  );
}

function DesktopSidebar({
  email,
  pathname,
  unread,
}: {
  email: string;
  pathname: string;
  unread: number;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line/80 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-accent text-[13px] font-bold text-accent-ink">
          G
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Grok Bots</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = primaryTabFromPathname(pathname) === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`inline-flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${
                active ? "bg-chip text-foreground" : "text-muted hover:bg-chip hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {tab.label}
            </Link>
          );
        })}
        <div className="my-2 h-px bg-line" />
        {MORE_LINKS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${
                active ? "bg-chip text-foreground" : "text-muted hover:bg-chip hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {item.badge && unread > 0 ? <Badge count={unread} /> : null}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-line px-3 py-3">
        <ThemeRow />
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            title={email}
            className="inline-flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm text-muted hover:bg-chip hover:text-foreground"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}

function MobileHeader({ title, compact }: { title: string; compact: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
      <div
        className={`safe-px flex min-w-0 items-end transition-[height] duration-200 ${
          compact ? "h-12" : "h-16"
        }`}
      >
        <h1
          className={`min-w-0 truncate font-semibold tracking-tight ${
            compact ? "pb-2.5 text-lg" : "pb-3 text-[1.65rem]"
          }`}
        >
          {title}
        </h1>
      </div>
    </header>
  );
}

function MobileTabBar({
  activeTab,
  hidden,
  unread,
  moreOpen,
}: {
  activeTab: ReturnType<typeof primaryTabFromPathname>;
  hidden: boolean;
  unread: number;
  moreOpen: boolean;
}) {
  const homeActive = activeTab === "inicio";
  const moreActive = moreOpen || activeTab === "mas";
  const leftIndex = LEFT_TABS.findIndex((tab) => tab.id === activeTab);
  const rightIndex = moreActive ? 1 : RIGHT_TABS.findIndex((tab) => tab.id === activeTab);

  return (
    <nav
      aria-label="Principal"
      className={`tab-dock lg:hidden ${hidden ? "tab-dock-hidden" : ""}`}
    >
      <div className="tab-dock-bar">
        <SideCluster
          activeIndex={leftIndex}
          slots={2}
        >
          {LEFT_TABS.map((tab) => (
            <TabLink key={tab.id} tab={tab} active={activeTab === tab.id} />
          ))}
        </SideCluster>
        <span className="tab-dock-notch" aria-hidden />
        <SideCluster
          activeIndex={rightIndex}
          slots={2}
        >
          {RIGHT_TABS.map((tab) => (
            <TabLink key={tab.id} tab={tab} active={activeTab === tab.id && !moreActive} />
          ))}
          <button
            type="button"
            popoverTarget="more-menu"
            className={`tab-item ${moreActive ? "tab-item-active" : ""}`}
            aria-current={activeTab === "mas" ? "page" : undefined}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <span className="pointer-events-none relative">
              <Menu
                size={20}
                strokeWidth={moreActive ? 2.35 : 1.75}
                fill={moreActive ? "currentColor" : "none"}
              />
              {unread > 0 ? <span className="tab-badge" /> : null}
            </span>
            <span className="pointer-events-none">Más</span>
          </button>
        </SideCluster>
      </div>
      <Link
        href="/"
        aria-label="Inicio"
        aria-current={homeActive ? "page" : undefined}
        className={`tab-fab ${homeActive ? "tab-fab-active" : ""}`}
      >
        <Home
          size={26}
          strokeWidth={homeActive ? 2.3 : 1.9}
          fill={homeActive ? "currentColor" : "none"}
          className="pointer-events-none"
        />
      </Link>
    </nav>
  );
}

function SideCluster({
  children,
  activeIndex,
  slots,
}: {
  children: React.ReactNode;
  activeIndex: number;
  slots: number;
}) {
  return (
    <div className="relative flex min-w-0 flex-1">
      {activeIndex >= 0 ? (
        <span
          className="tab-indicator"
          style={{
            width: `${100 / slots}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

function TabLink({
  tab,
  active,
}: {
  tab: { id: string; href: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={`tab-item ${active ? "tab-item-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        size={20}
        strokeWidth={active ? 2.35 : 1.75}
        fill={active && tab.id === "guardados" ? "currentColor" : "none"}
        className="pointer-events-none"
      />
      <span className="pointer-events-none">{tab.label}</span>
    </Link>
  );
}

function MoreSheet({
  email,
  unread,
  pathname,
  onClose,
}: {
  email: string;
  unread: number;
  pathname: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [iosHelp, setIosHelp] = useState(false);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    setInstallable(canNativeInstall());
    return subscribeInstall(() => setInstallable(canNativeInstall()));
  }, []);

  async function install() {
    if (await promptNativeInstall()) return;
    if (isIosDevice() && !isStandaloneDisplay()) setIosHelp(true);
  }

  const showInstall = !isStandaloneDisplay() && (installable || isIosDevice()) && !wasInstallDismissed();

  return (
    <div
      id="more-menu"
      popover="auto"
      aria-labelledby={titleId}
      className="more-sheet lg:hidden"
    >
      <div className="mx-auto max-h-[88vh] overflow-y-auto rounded-t-3xl bg-card px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <h2 id={titleId} className="px-1 text-lg font-semibold tracking-tight">
          Más
        </h2>
        <ul className="mt-3 space-y-1">
          {MORE_LINKS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${
                    active ? "bg-chip" : "hover:bg-chip"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && unread > 0 ? <Badge count={unread} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Apariencia
        </p>
        <ThemeRow className="mt-2" />
        {showInstall ? (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-chip"
          >
            <Smartphone size={18} strokeWidth={1.75} />
            Instalar app
          </button>
        ) : null}
        {iosHelp ? (
          <p className="mt-2 px-3 text-xs leading-5 text-muted">
            En Safari: tocá <Share size={12} className="inline" strokeWidth={1.75} /> Compartir y
            después <span className="font-medium text-foreground">Agregar a inicio</span>.
          </p>
        ) : null}
        <form action="/auth/sign-out" method="post" className="mt-2">
          <button
            type="submit"
            title={email}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted hover:bg-chip hover:text-foreground"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

function ThemeRow({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    setMode(readStoredTheme());
    return subscribeTheme(() => setMode(readStoredTheme()));
  }, []);
  const options: Array<{ id: ThemeMode; icon: typeof Sun; label: string }> = [
    { id: "light", icon: Sun, label: "Claro" },
    { id: "dark", icon: Moon, label: "Oscuro" },
    { id: "system", icon: Monitor, label: "Sistema" },
  ];
  return (
    <div className={`grid grid-cols-3 gap-1 rounded-2xl bg-chip p-1 ${className}`}>
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => persistThemeMode(option.id)}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-medium ${
              active ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
            aria-pressed={active}
            aria-label={`Tema ${themeLabel(option.id)}`}
          >
            <Icon size={14} strokeWidth={1.75} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
      {count > 9 ? "9+" : count}
    </span>
  );
}

