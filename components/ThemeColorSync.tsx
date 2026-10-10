"use client";

import { useEffect } from "react";
import { readStoredTheme, subscribeTheme } from "@/lib/theme";

const LIGHT = "#f3f0ea";
const DARK = "#0c0f12";

function currentColor() {
  return document.documentElement.classList.contains("dark") ? DARK : LIGHT;
}

function applyThemeColor() {
  const color = currentColor();
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", color);
  }
}

export function ThemeColorSync() {
  useEffect(() => {
    applyThemeColor();
    return subscribeTheme(() => {
      applyThemeColor();
      void readStoredTheme();
    });
  }, []);
  return null;
}
