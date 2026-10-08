"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Radio } from "lucide-react";

export function LiveRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
      <Radio size={14} strokeWidth={1.75} className="animate-pulse" />
      En vivo
    </span>
  );
}
