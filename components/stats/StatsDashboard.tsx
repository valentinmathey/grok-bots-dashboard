"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { ActivityByDayCard } from "@/components/stats/ActivityByDayCard";
import { BotsCompareCard } from "@/components/stats/BotsCompareCard";
import { ConsistencyCard } from "@/components/stats/ConsistencyCard";
import { HeatmapCard } from "@/components/stats/HeatmapCard";
import { InsightsCard } from "@/components/stats/InsightsCard";
import { KindsCard } from "@/components/stats/KindsCard";
import { KpiStrip } from "@/components/stats/KpiStrip";
import { PostsByBotCard } from "@/components/stats/PostsByBotCard";
import { TagsCard } from "@/components/stats/TagsCard";
import {
  DEFAULT_STATS_LAYOUT,
  STATS_LAYOUT_KEY,
  cardSpansFull,
  mergeStatsLayout,
  type StatCardId,
  type StatsLayout,
} from "@/lib/stats-layout";
import type { StatsSnapshot } from "@/lib/stats";

function persist(layout: StatsLayout) {
  try {
    localStorage.setItem(STATS_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    /* ignore quota */
  }
  void fetch("/api/admin/stats-layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout }),
  }).catch(() => undefined);
}

function SortableCard({
  id,
  sorting,
  wide,
  children,
}: {
  id: StatCardId;
  sorting: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !sorting });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative min-w-0 ${wide ? "lg:col-span-2" : ""} ${
        isDragging ? "z-20" : ""
      }`}
    >
      {sorting ? (
        <button
          type="button"
          className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-card/90 text-muted shadow-sm"
          aria-label="Arrastrar card"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      ) : null}
      {children}
    </div>
  );
}

export function StatsDashboard({
  data,
  initialLayout,
}: {
  data: StatsSnapshot;
  initialLayout: StatsLayout;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [sorting, setSorting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_LAYOUT_KEY);
      if (!raw) return;
      const local = mergeStatsLayout(JSON.parse(raw));
      const serverDefault =
        JSON.stringify(initialLayout) === JSON.stringify(DEFAULT_STATS_LAYOUT);
      if (serverDefault) setLayout(local);
    } catch {
      /* ignore */
    }
  }, [initialLayout]);
  const visible = useMemo(
    () => layout.order.filter((id) => !layout.hidden.includes(id)),
    [layout],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(next: StatsLayout) {
    const merged = mergeStatsLayout(next);
    setLayout(merged);
    persist(merged);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = visible.indexOf(active.id as StatCardId);
    const to = visible.indexOf(over.id as StatCardId);
    if (from < 0 || to < 0) return;
    const nextVisible = arrayMove(visible, from, to);
    const hidden = layout.order.filter((id) => layout.hidden.includes(id));
    update({ ...layout, order: [...nextVisible, ...hidden] });
  }

  function hide(id: StatCardId) {
    update({ ...layout, hidden: [...layout.hidden, id] });
  }

  const cardProps = (id: StatCardId) => ({
    onHide: () => hide(id),
  });

  const cards: Record<StatCardId, ReactNode> = {
    kpi: <KpiStrip items={data.kpis} {...cardProps("kpi")} />,
    "posts-bot": <PostsByBotCard bots={data.bots} {...cardProps("posts-bot")} />,
    constancia: <ConsistencyCard bots={data.bots} {...cardProps("constancia")} />,
    actividad: (
      <ActivityByDayCard
        days={data.days}
        bots={data.bots}
        posts={data.dayPosts}
        {...cardProps("actividad")}
      />
    ),
    horario: <HeatmapCard cells={data.heatmap} bots={data.bots} {...cardProps("horario")} />,
    tipos: <KindsCard kinds={data.kinds} {...cardProps("tipos")} />,
    tags: <TagsCard tags={data.tags} {...cardProps("tags")} />,
    insights: <InsightsCard domain={data.domain} {...cardProps("insights")} />,
    comparativa: (
      <BotsCompareCard days={data.days} bots={data.bots} {...cardProps("comparativa")} />
    ),
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSorting((value) => !value)}
          className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium ${
            sorting ? "bg-accent text-accent-ink" : "bg-chip"
          }`}
          aria-pressed={sorting}
        >
          Ordenar
        </button>
        <button
          type="button"
          onClick={() => update(DEFAULT_STATS_LAYOUT)}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted"
        >
          Restablecer
        </button>
        {layout.hidden.length ? (
          <button
            type="button"
            onClick={() => update({ ...layout, hidden: [] })}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted"
          >
            Mostrar ocultas ({layout.hidden.length})
          </button>
        ) : null}
        {sorting ? (
          <p className="text-xs text-muted">
            Arrastrá las cards. En el celu, mantené ~200 ms. Tab + flechas también.
          </p>
        ) : null}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visible} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {visible.map((id) => (
              <SortableCard
                key={id}
                id={id}
                sorting={sorting}
                wide={cardSpansFull(id, visible)}
              >
                {cards[id]}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
