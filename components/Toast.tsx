"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

let show: ((message: string) => void) | null = null;

export function showToast(message: string) {
  show?.(message);
}

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    show = (next) => {
      setMessage(next);
      window.setTimeout(() => setMessage((current) => (current === next ? null : current)), 2400);
    };
    return () => {
      if (show) show = null;
    };
  }, []);

  if (!mounted || !message) return null;
  return createPortal(
    <div
      role="status"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[80] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg"
    >
      {message}
    </div>,
    document.body,
  );
}
