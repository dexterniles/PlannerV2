"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type ReactNode } from "react";

import { rowHeight, useDensity } from "@/components/layout/DensityContext";
import { cn } from "@/lib/utils";

export type ListGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

type Row<T> =
  | { type: "header"; key: string; label: string; count: number }
  | { type: "item"; key: string; item: T };

const VIRTUALIZE_THRESHOLD = 200;
const HEADER_HEIGHT = 32;

export function ListView<T>({
  groups,
  getId,
  activeId,
  renderRow,
  onRowClick,
  isSelected,
}: {
  groups: ListGroup<T>[];
  getId: (item: T) => string;
  activeId: string | null;
  renderRow: (item: T, state: { active: boolean }) => ReactNode;
  onRowClick: (item: T) => void;
  isSelected?: (item: T) => boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = rowHeight(useDensity());

  const rows: Row<T>[] = [];
  for (const g of groups) {
    if (g.items.length === 0) continue;
    rows.push({
      type: "header",
      key: `h:${g.key}`,
      label: g.label,
      count: g.items.length,
    });
    for (const item of g.items) {
      rows.push({ type: "item", key: getId(item), item });
    }
  }

  const total = rows.reduce(
    (n, r) => n + (r.type === "item" ? 1 : 0),
    0,
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is the spec-mandated virtualization lib (§12)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) =>
      rows[i].type === "header" ? HEADER_HEIGHT : ROW_HEIGHT,
    overscan: 12,
  });

  function HeaderRow({ label, count }: { label: string; count: number }) {
    return (
      <div className="flex h-8 items-center gap-2 bg-bg px-4 text-xs font-medium text-text-subtle">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="text-text-subtle">{count}</span>
      </div>
    );
  }

  function ItemRow({ item }: { item: T }) {
    const id = getId(item);
    const active = id === activeId;
    const selected = isSelected?.(item) ?? false;
    return (
      <div
        role="row"
        data-active={active}
        data-selected={selected}
        onClick={() => onRowClick(item)}
        style={{ height: ROW_HEIGHT }}
        className={cn(
          "relative flex cursor-default items-center gap-3 border-b border-border-subtle px-4 text-[13px] transition-colors duration-[60ms] hover:bg-bg-hover max-sm:text-xs",
          active && "bg-bg-hover",
          selected && "bg-brand/10",
        )}
      >
        {selected ? (
          <span className="absolute left-0 top-0 h-full w-0.5 bg-brand" />
        ) : null}
        {renderRow(item, { active })}
      </div>
    );
  }

  if (total <= VIRTUALIZE_THRESHOLD) {
    return (
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        {rows.map((r) =>
          r.type === "header" ? (
            <HeaderRow key={r.key} label={r.label} count={r.count} />
          ) : (
            <ItemRow key={r.key} item={r.item} />
          ),
        )}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: "relative" }}
      >
        {virtualizer.getVirtualItems().map((v) => {
          const r = rows[v.index];
          return (
            <div
              key={r.key}
              ref={virtualizer.measureElement}
              data-index={v.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${v.start}px)`,
              }}
            >
              {r.type === "header" ? (
                <HeaderRow label={r.label} count={r.count} />
              ) : (
                <ItemRow item={r.item} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
