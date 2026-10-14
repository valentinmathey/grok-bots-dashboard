"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  Bell,
  CalendarClock,
  CalendarDays,
  Headphones,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Newspaper,
  Search,
  Settings,
  Star,
  Sun,
} from "lucide-react";
import { InstallAppButton } from "@/components/InstallAppButton";
import { SearchOverlay } from "@/components/SearchOverlay";
import { Sheet } from "@/components/Sheet";
import { ThemeColorSync } from "@/components/ThemeColorSync";
import { useNav } from "@/components/nav-context";
import { primaryTabFromPathname, titleFromPathname } from "@/lib/nav";
import { isIosDevice, isStandaloneDisplay } from "@/lib/pwa-install";
import { shouldAutoHideTabBar, syncVisualViewportInset } from "@/lib/viewport";
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
  { id: "bots", href: "/bots", label: "Bots", icon: Bot },
] as const;

const LEFT_TABS = [
  { id: "agenda", href: "/agenda", label: "Agenda", icon: CalendarDays },
  { id: "buscar", href: "/buscar", label: "Buscar", icon: Search },
] as const;

const RIGHT_TABS = [
  { id: "bots", href: "/bots", label: "Bots", icon: Bot },
] as const;

const MORE_LINKS = [
  { href: "/publicaciones", label: "Publicaciones", icon: Newspaper, badge: false },
  { href: "/audios", label: "Audios", icon: Headphones, badge: false },
  { href: "/pedidos", label: "Pedidos", icon: MessageSquare, badge: true },
  { href: "/favoritos", label: "Favoritos", icon: Star, badge: false },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3, badge: false },
  { href: "/rutinas", label: "Rutinas", icon: CalendarClock, badge: false },
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
    setMoreOpen(false);
  }

  useEffect(() => {
    const hideOnScroll = shouldAutoHideTabBar(isIosDevice(), isStandaloneDisplay());
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setCompact(y > 24);
      if (!hideOnScroll || moreOpen || searchOpen) {
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
    syncVisualViewportInset();
    const visual = window.visualViewport;
    function update() {
      syncVisualViewportInset();
    }
    visual?.addEventListener("resize", update);
    visual?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      visual?.removeEventListener("resize", update);
      visual?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
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
        onMore={() => setMoreOpen(true)}
      />
      <MoreSheet
        open={moreOpen}
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
        <BrandMark size={36} className="h-9 w-9" />
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
      <div className="border-t border-line px-3 py-3">
        <ThemeRow />
        <div className="my-2 h-px bg-line" />
        <InstallAppButton className="inline-flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted hover:bg-chip hover:text-foreground" />
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            title={email}
            className="inline-flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted hover:bg-chip hover:text-foreground"
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
  onMore,
}: {
  activeTab: ReturnType<typeof primaryTabFromPathname>;
  hidden: boolean;
  unread: number;
  moreOpen: boolean;
  onMore: () => void;
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
            onClick={onMore}
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
            width: `calc(${100 / slots}% - 0.36rem)`,
            transform: `translateX(calc(${activeIndex} * 100% + ${activeIndex} * 0.36rem))`,
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
        fill="none"
        className="pointer-events-none"
      />
      <span className="pointer-events-none">{tab.label}</span>
    </Link>
  );
}

function MoreSheet({
  open,
  email,
  unread,
  pathname,
  onClose,
}: {
  open: boolean;
  email: string;
  unread: number;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Más" mobileOnly>
      <div>
        <ul className="space-y-1">
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
        <InstallAppButton className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-chip" />
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
    </Sheet>
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
    <div
      className={`grid w-full min-w-0 grid-cols-3 gap-1 rounded-2xl bg-chip p-1 ${className}`}
      role="group"
      aria-label="Tema"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => persistThemeMode(option.id)}
            title={themeLabel(option.id)}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] leading-none ${
              active
                ? "bg-card font-semibold text-foreground shadow-sm"
                : "font-medium text-muted hover:text-foreground"
            }`}
            aria-pressed={active}
            aria-label={`Tema ${themeLabel(option.id)}`}
          >
            <Icon size={18} strokeWidth={active ? 2.1 : 1.75} />
            <span className="max-w-full truncate">{option.label}</span>
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

