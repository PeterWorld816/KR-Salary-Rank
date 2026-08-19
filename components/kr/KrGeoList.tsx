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
        className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-[#34D399] focus:bg-white/[0.09]"
      />
      <div className="overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]" style={{ maxHeight }}>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-white/40">{emptyText}</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center justify-between gap-3 border-b border-white/[0.05] px-3 py-2.5 text-left text-[13px] transition-colors last:border-0 ${
                item.disabled
                  ? "cursor-not-allowed text-white/30"
                  : `hover:bg-white/[0.06] hover:text-white ${item.id === selectedId ? "bg-[#34D399]/[0.10] text-white" : "text-white/80"}`
              }`}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{item.name}</span>
                {item.badge && !item.disabled && (
                  <span className="shrink-0 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#34D399]">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.sub && <span className="flex-shrink-0 tabular-nums text-white/40">{item.sub}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
