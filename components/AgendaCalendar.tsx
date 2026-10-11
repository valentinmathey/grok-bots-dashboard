"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AgendaDayList } from "@/components/AgendaEventRow";
import { Sheet } from "@/components/Sheet";
import type { AgendaEntry } from "@/lib/agenda";
import {
  agendaHref,
  buildMonthGrid,
  entryCoversDay,
  formatAgendaDayHeading,
  formatAgendaTime,
  formatMonthTitle,
  shiftMonth,
  stripDateFromTitle,
  weekdayLabels,
  type AgendaQuery,
} from "@/lib/calendar";

export function AgendaCalendar({
  entries,
  query,
  today,
  tomorrow,
}: {
  entries: AgendaEntry[];
  query: AgendaQuery;
  today: string;
  tomorrow: string;
}) {
  const weeks = useMemo(
    () => buildMonthGrid(query.month, today, entries, 2),
    [entries, query.month, today],
  );
  const defaultDay = useMemo(() => {
    if (weeks.some((week) => week.days.some((day) => day.ymd === today && day.inMonth))) {
      return today;
    }
    return `${query.month}-01`;
  }, [query.month, today, weeks]);
  const [selected, setSelected] = useState(defaultDay);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popover, setPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(defaultDay);
    setSheetOpen(false);
    setPopover(false);
  }, [defaultDay]);

  useEffect(() => {
    if (!popover) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPopover(false);
    }
    function onClick(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopover(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [popover]);

  const dayEntries = entries.filter((entry) => entryCoversDay(entry, selected));
  const prev = shiftMonth(query.month, -1);
  const next = shiftMonth(query.month, 1);

  function openDay(ymd: string, source: "mobile" | "desktop") {
    setSelected(ymd);
    if (source === "mobile") {
      setSheetOpen(true);
      setPopover(false);
    } else {
      setPopover(true);
      setSheetOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={agendaHref(query, { month: prev })}
          aria-label="Mes anterior"
          className="grid h-11 w-11 place-items-center rounded-full border border-line"
        >
          <ChevronLeft size={18} />
        </Link>
        <h2 className="min-w-0 flex-1 text-center text-base font-semibold sm:text-lg">
          {formatMonthTitle(query.month)}
        </h2>
        <Link
          href={agendaHref(query, { month: today.slice(0, 7) })}
          className="inline-flex h-11 items-center rounded-full border border-line px-3 text-sm font-medium"
        >
          Hoy
        </Link>
        <Link
          href={agendaHref(query, { month: next })}
          aria-label="Mes siguiente"
          className="grid h-11 w-11 place-items-center rounded-full border border-line"
        >
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted">
        {weekdayLabels().map((label, index) => (
          <div key={`${label}-${index}`} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-1 lg:hidden">
        {weeks.map((week) => (
          <div key={week.days[0]!.ymd} className="grid grid-cols-7 gap-1">
            {week.days.map((day) => {
              const dots = uniqueBotColors(
                entries.filter((entry) => entryCoversDay(entry, day.ymd)),
              );
              return (
                <button
                  key={day.ymd}
                  type="button"
                  onClick={() => openDay(day.ymd, "mobile")}
                  className={`flex min-h-11 flex-col items-center justify-center rounded-2xl px-0.5 py-1 ${
                    day.isToday ? "ring-2 ring-accent" : ""
                  } ${selected === day.ymd ? "bg-chip" : "bg-card"} ${
                    day.isWeekend ? "bg-chip/60" : ""
                  } ${day.inMonth ? "" : "opacity-40"}`}
                  aria-label={formatAgendaDayHeading(day.ymd, today, tomorrow)}
                  aria-current={day.isToday ? "date" : undefined}
                >
                  <span className="text-sm font-medium">{day.day}</span>
                  <span className="mt-0.5 flex h-2 items-center justify-center gap-0.5">
                    {dots.slice(0, 3).map((color, index) => (
                      <span
                        key={`${day.ymd}-${index}`}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: color }}
                      />
                    ))}
                    {dots.length > 3 ? (
                      <span className="text-[9px] leading-none text-muted">+</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="space-y-1">
          {weeks.map((week) => (
            <div key={week.days[0]!.ymd} className="relative">
              <div className="grid grid-cols-7 gap-1">
                {week.days.map((day, col) => (
                  <button
                    key={day.ymd}
                    type="button"
                    onClick={() => openDay(day.ymd, "desktop")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openDay(day.ymd, "desktop");
                    }}
                    className={`relative flex min-h-28 flex-col rounded-2xl border px-1.5 pb-1.5 pt-1 text-left ${
                      day.isToday ? "border-accent ring-2 ring-accent/40" : "border-transparent"
                    } ${day.isWeekend ? "bg-chip/70" : "bg-card"} ${
                      day.inMonth ? "" : "opacity-45"
                    }`}
                    aria-label={formatAgendaDayHeading(day.ymd, today, tomorrow)}
                  >
                    <span className="mb-5 text-xs font-semibold">{day.day}</span>
                    <span className="mt-auto space-y-0.5">
                      {week.pills[col]!.map((entry) => (
                        <span
                          key={entry.id}
                          className="flex items-center gap-1 rounded-md bg-chip px-1 py-0.5 text-[10px] leading-tight"
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: entry.bot.avatar_color || "var(--accent)" }}
                          />
                          <span className="min-w-0 truncate">
                            {formatAgendaTime(entry.startsAt, entry.allDay)
                              ? `${formatAgendaTime(entry.startsAt, entry.allDay)} `
                              : ""}
                            {stripDateFromTitle(entry.title)}
                          </span>
                        </span>
                      ))}
                      {week.extra[col]! > 0 ? (
                        <span className="text-[10px] text-muted">+{week.extra[col]} más</span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
              {week.spans.map((span) => (
                <div
                  key={span.id}
                  className="pointer-events-none absolute top-6 flex h-5 px-1"
                  style={{
                    left: `calc(${(span.colStart / 7) * 100}% + 2px)`,
                    width: `calc(${((span.colEnd - span.colStart + 1) / 7) * 100}% - 4px)`,
                  }}
                >
                  <span
                    className={`flex min-w-0 flex-1 items-center gap-1 bg-accent px-1.5 text-[10px] font-medium text-accent-ink ${
                      span.continuesBefore ? "rounded-r-md" : "rounded-md"
                    } ${span.continuesAfter ? "rounded-l-md rounded-r-none" : ""}`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-ink/80"
                      style={{ background: span.entry.bot.avatar_color || undefined }}
                    />
                    <span className="truncate">{stripDateFromTitle(span.entry.title)}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        <h3 className="mb-2 text-sm font-semibold">
          {formatAgendaDayHeading(selected, today, tomorrow)}
        </h3>
        <AgendaDayList entries={dayEntries} />
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={formatAgendaDayHeading(selected, today, tomorrow)}
      >
        <AgendaDayList entries={dayEntries} />
      </Sheet>

      {popover ? (
        <div
          ref={popoverRef}
          className="fixed inset-0 z-40 hidden items-center justify-center bg-black/30 p-4 lg:flex"
          role="dialog"
          aria-modal="true"
          aria-label={formatAgendaDayHeading(selected, today, tomorrow)}
        >
          <div className="surface w-full max-w-md rounded-3xl p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {formatAgendaDayHeading(selected, today, tomorrow)}
              </h3>
              <button
                type="button"
                onClick={() => setPopover(false)}
                className="rounded-full px-3 py-1.5 text-sm text-muted"
              >
                Cerrar
              </button>
            </div>
            <AgendaDayList entries={dayEntries} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function uniqueBotColors(entries: AgendaEntry[]): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const entry of entries) {
    const color = entry.bot.avatar_color || "var(--accent)";
    const key = `${entry.bot.slug}:${color}`;
    if (seen.has(key)) continue;
    seen.add(key);
    colors.push(color);
  }
  return colors;
}
