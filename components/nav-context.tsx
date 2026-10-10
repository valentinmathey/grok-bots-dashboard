"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NavContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  unreadPedidos: number;
};

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({
  children,
  unreadPedidos,
}: {
  children: ReactNode;
  unreadPedidos: number;
}) {
  const [title, setTitle] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const value = useMemo(
    () => ({
      title,
      setTitle,
      searchOpen,
      setSearchOpen,
      unreadPedidos,
    }),
    [title, searchOpen, unreadPedidos],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error("useNav requiere NavProvider");
  }
  return ctx;
}

export function useOptionalNav() {
  return useContext(NavContext);
}

export function NavTitle({ title }: { title: string }) {
  const { setTitle } = useNav();
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
  return null;
}
