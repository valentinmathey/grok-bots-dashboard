"use client";

import { useRef } from "react";
import { CalendarDays, X } from "lucide-react";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { DATE_PRESETS, formatDmy, matchingPreset, presetRange } from "@/lib/date-presets";

type Range = { from?: string; to?: string };

function DateInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value?: string;
  min?: string;
  max?: string;
  onChange: (value: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = formatDmy(value);

  return (
    <label className="block min-w-0 text-xs">
      <span className="mb-1 block font-medium text-muted">{label}</span>
      <span className="relative flex min-h-11 w-full min-w-0 items-center gap-2 rounded-2xl border border-line bg-raised pl-3 pr-1 text-sm focus-within:ring-2 focus-within:ring-accent/50">
        <CalendarDays size={16} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden />
        <span className={`min-w-0 flex-1 truncate tabular-nums ${shown ? "text-foreground" : "text-muted"}`}>
          {shown || "dd/mm/aaaa"}
        </span>
        {/* Input nativo invisible encima: abre el picker del sistema (iOS incluido) sin el render roto. */}
        <input
          ref={inputRef}
          type="date"
          aria-label={label}
          value={value ?? ""}
          min={min}
          max={max}
          onClick={() => {
            try {
              inputRef.current?.showPicker?.();
            } catch {
              /* algunos browsers no permiten showPicker; el input igual recibe el tap */
            }
          }}
          onChange={(event) => onChange(event.target.value || undefined)}
          className="date-native absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {value ? (
          <button
            type="button"
            aria-label={`Borrar ${label.toLowerCase()}`}
            onClick={(event) => {
              event.preventDefault();
              onChange(undefined);
            }}
            className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-chip hover:text-foreground"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        ) : (
          <span className="h-9 w-1 shrink-0" aria-hidden />
        )}
      </span>
    </label>
  );
}

/** Filtro de fechas compartido: presets + Desde/Hasta en grilla de 2 columnas. */
export function DateRangeField({
  value,
  onChange,
  title = "Fecha",
}: {
  value: Range;
  onChange: (next: Range) => void;
  title?: string;
}) {
  const activePreset = matchingPreset(value);

  return (
    <section className="mt-5 min-w-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        <CalendarDays size={12} strokeWidth={1.75} className="mr-1 inline" />
        {title}
      </p>
      <ChipRow>
        {DATE_PRESETS.map((preset) => {
          const selected = activePreset === preset.id;
          return (
            <FilterChip
              key={preset.id}
              size="sm"
              selected={selected}
              check={selected}
              onClick={() => onChange(selected ? {} : presetRange(preset.id))}
            >
              {preset.label}
            </FilterChip>
          );
        })}
      </ChipRow>
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <DateInput
          label="Desde"
          value={value.from}
          max={value.to}
          onChange={(from) => onChange({ ...value, from })}
        />
        <DateInput
          label="Hasta"
          value={value.to}
          min={value.from}
          onChange={(to) => onChange({ ...value, to })}
        />
      </div>
    </section>
  );
}
