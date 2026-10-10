export function visualViewportBottomInset(
  innerHeight: number,
  visual: { height: number; offsetTop: number } | null | undefined,
): number {
  if (!visual) return 0;
  return Math.max(0, innerHeight - (visual.height + visual.offsetTop));
}

export function readVisualViewportBottomInset(): number {
  if (typeof window === "undefined") return 0;
  const visual = window.visualViewport;
  return visualViewportBottomInset(
    window.innerHeight,
    visual ? { height: visual.height, offsetTop: visual.offsetTop } : null,
  );
}

export function syncVisualViewportInset() {
  if (typeof document === "undefined") return 0;
  const inset = readVisualViewportBottomInset();
  document.documentElement.style.setProperty("--vv-bottom", `${Math.round(inset)}px`);
  return inset;
}

export function tabDockHideOffset(): string {
  return "calc(100% + env(safe-area-inset-bottom, 0px) + 2.5rem + var(--vv-bottom, 0px))";
}

export function shouldAutoHideTabBar(ios: boolean, standalone: boolean) {
  return !(ios && !standalone);
}
