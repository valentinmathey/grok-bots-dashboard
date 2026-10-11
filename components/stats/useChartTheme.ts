"use client";

import { useEffect, useState } from "react";
import { subscribeTheme } from "@/lib/theme";

export type ChartTheme = {
  ink: string;
  muted: string;
  accent: string;
  card: string;
  line: string;
  dark: boolean;
};

function readTheme(): ChartTheme {
  if (typeof window === "undefined") {
    return {
      ink: "#171411",
      muted: "#6e675e",
      accent: "#0f766e",
      card: "#ffffff",
      line: "#e6dfd4",
      dark: false,
    };
  }
  const styles = getComputedStyle(document.documentElement);
  return {
    ink: styles.getPropertyValue("--ink").trim() || "#171411",
    muted: styles.getPropertyValue("--muted").trim() || "#6e675e",
    accent: styles.getPropertyValue("--accent").trim() || "#0f766e",
    card: styles.getPropertyValue("--bg-card").trim() || "#ffffff",
    line: styles.getPropertyValue("--line").trim() || "#e6dfd4",
    dark: document.documentElement.classList.contains("dark"),
  };
}

export function useChartTheme() {
  const [theme, setTheme] = useState<ChartTheme>(readTheme);
  useEffect(() => {
    setTheme(readTheme());
    const unsub = subscribeTheme(() => setTheme(readTheme()));
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => {
      unsub();
      observer.disconnect();
    };
  }, []);
  return theme;
}

export function chartDefaults(theme: ChartTheme) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest" as const, intersect: false },
    plugins: {
      legend: {
        labels: { color: theme.muted, boxWidth: 10, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: theme.card,
        titleColor: theme.ink,
        bodyColor: theme.ink,
        borderColor: theme.line,
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: theme.muted, font: { size: 10 }, maxRotation: 0 },
        grid: { color: theme.line },
        border: { display: false },
      },
      y: {
        ticks: { color: theme.muted, font: { size: 10 } },
        grid: { color: theme.line },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };
}
