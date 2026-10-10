import type { Bot } from "@/lib/types";

export function compareBotOrder(
  a: Pick<Bot, "name" | "sort_order">,
  b: Pick<Bot, "name" | "sort_order">,
): number {
  const left = a.sort_order ?? 0;
  const right = b.sort_order ?? 0;
  if (left !== right) return left - right;
  return a.name.localeCompare(b.name, "es");
}

export function nextSortOrder(bots: Array<Pick<Bot, "sort_order">>): number {
  return bots.reduce((max, bot) => Math.max(max, bot.sort_order ?? 0), -1) + 1;
}

export function applyBotOrder<T extends { id: string }>(
  items: T[],
  ids: string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (item) ordered.push(item);
  }
  for (const item of items) {
    if (!ids.includes(item.id)) ordered.push(item);
  }
  return ordered;
}
