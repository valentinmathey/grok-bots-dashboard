"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { BotCard } from "@/components/BotCard";
import type { BotSummary } from "@/lib/types";

function SortableBot({
  bot,
  sorting,
}: {
  bot: BotSummary;
  sorting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: bot.id, disabled: !sorting });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative min-w-0 ${isDragging ? "z-20 scale-[1.02] shadow-xl" : ""} ${
        sorting ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      {...(sorting ? { ...attributes, ...listeners } : {})}
    >
      {sorting ? (
        <span
          className="pointer-events-none absolute left-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-card/90 text-muted shadow-sm"
          aria-hidden
        >
          <GripVertical size={16} strokeWidth={1.75} />
        </span>
      ) : null}
      <div className={sorting ? "pointer-events-none" : undefined}>
        <BotCard bot={bot} />
      </div>
    </div>
  );
}

export function BotBoard({ initialBots }: { initialBots: BotSummary[] }) {
  const [bots, setBots] = useState(initialBots);
  const [sorting, setSorting] = useState(false);
  const [saving, setSaving] = useState(false);
  const ids = useMemo(() => bots.map((bot) => bot.id), [bots]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persist(next: BotSummary[]) {
    setSaving(true);
    try {
      await fetch("/api/admin/bots/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((bot) => bot.id) }),
      });
    } finally {
      setSaving(false);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = bots.findIndex((bot) => bot.id === active.id);
    const to = bots.findIndex((bot) => bot.id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(bots, from, to).map((bot, index) => ({
      ...bot,
      sort_order: index,
    }));
    setBots(next);
    void persist(next);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSorting((value) => !value)}
          className={`inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium ${
            sorting ? "bg-accent text-accent-ink" : "bg-chip text-foreground"
          }`}
          aria-pressed={sorting}
        >
          Ordenar
        </button>
        {saving ? <span className="text-xs text-muted">Guardando…</span> : null}
        {sorting ? (
          <p className="text-xs text-muted">
            Arrastrá las cards. En el celu, mantené ~200 ms. Tab + flechas también.
          </p>
        ) : null}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {bots.map((bot) => (
              <SortableBot key={bot.id} bot={bot} sorting={sorting} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
