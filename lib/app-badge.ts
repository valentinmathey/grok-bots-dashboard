type BadgeNavigator = {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/** Pone o limpia el número del ícono si el navegador lo soporta; nunca tira error. */
export async function applyAppBadge(count: number, nav: unknown = typeof navigator === "undefined" ? undefined : navigator) {
  const target = nav as BadgeNavigator | undefined;
  if (!target?.setAppBadge) return false;
  try {
    if (count > 0) await target.setAppBadge(Math.min(count, 99));
    else if (target.clearAppBadge) await target.clearAppBadge();
    else await target.setAppBadge(0);
    return true;
  } catch {
    return false;
  }
}
