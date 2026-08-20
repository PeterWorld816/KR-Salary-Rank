"use client";
// Search + scrollable list alternative to clicking the map directly — same
// contract as components/us/UsGeoList.tsx, duplicated rather than imported so
// /kr stays independent of /us internals.
import { useMemo, useState } from "react";

export type KrGeoListItem = {
  id: string;
  name: string;
  sub?: string;
  disabled?: boolean;
  // Small pill shown next to the name, e.g. "시군구 상세 가능" — see
  // app/KrHomeClient.tsx's sidoItems for the 시/도 list's usage.
  badge?: string;
};

export default function KrGeoList({
  items,
  onSelect,
  searchPlaceholder,
  emptyText,
  className,
  maxHeight = 420,
  selectedId,
}: {
  items: KrGeoListItem[];
  onSelect: (id: string) => void;
  searchPlaceholder: string;
  emptyText: string;
  className?: string;
  maxHeight?: number;
  selectedId?: string;
}) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name, "ko")), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((item) => item.name.toLowerCase().includes(q));
  }, [sorted, query]);

  return (
    <div className={className}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="input mb-2"
      />
      <div className="overflow-y-auto rounded-lg border border-border bg-surface" style={{ maxHeight }}>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-caption text-text-tertiary">{emptyText}</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
              className={`touch-target flex w-full items-center justify-between gap-3 border-b border-border px-3 text-left text-caption transition-colors last:border-0 ${
                item.disabled
                  ? "cursor-not-allowed text-text-tertiary"
                  : `hover:bg-bg-subtle hover:text-text ${item.id === selectedId ? "bg-accent-tint text-text" : "text-text-secondary"}`
              }`}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{item.name}</span>
                {item.badge && !item.disabled && (
                  // Small pill next to a list row — same micro-label
                  // exception as KrInputPanel.tsx's ComingSoonBadge.
                  <span className="shrink-0 rounded-full border border-accent/30 bg-accent-tint px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.sub && <span className="flex-shrink-0 tabular-nums text-text-tertiary">{item.sub}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
