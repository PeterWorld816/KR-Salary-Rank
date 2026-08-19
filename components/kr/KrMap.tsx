"use client";
// 시/도(province)-level choropleth for /kr — v1 only, mirrors the visual
// language of components/us/UsMap.tsx but scoped down: Korea has no built-in
// d3-geo projection (unlike "geoAlbersUsa"), so this always fits a Mercator
// projection to the whole country, and there's no county-equivalent zoom
// level yet (see data/kr/regionIncome.json's meta.note — a 시군구 topology
// can be layered in the same way once more regions have real data).
import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoMercator } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

// react-simple-maps' `style` prop takes literal inline CSS, not Tailwind
// classes — these still resolve through the shared theme tokens
// (app/globals.css's `.kr-theme`) via CSS custom properties instead of
// hardcoding hex.
const ACCENT = "var(--color-accent)";
const ACCENT_PRESSED = "var(--color-accent-active)";
const DISABLED_FILL = "var(--color-bg-subtle)";

export type KrMapFeatureProps = { name: string; code: string };

export default function KrMap({
  geo,
  height = 520,
  disabledIds = new Set(),
  onSelect,
  getFill,
  getLabel,
}: {
  geo: FeatureCollection<Geometry, KrMapFeatureProps>;
  height?: number;
  // 시/도 codes that exist on the map but have no income row yet (see
  // data/kr/regionMeta.ts's `available: false`) — shown dimmed and inert.
  disabledIds?: Set<string>;
  onSelect: (id: string) => void;
  getFill: (id: string) => string;
  getLabel: (id: string) => string;
}) {
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const width = 720;

  const projection = useMemo(
    () => geoMercator().fitSize([width, height], geo as any) as any,
    [geo, height]
  );

  function handleClick(id: string) {
    if (disabledIds.has(id)) return;
    onSelect(id);
  }

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <ComposableMap projection={projection} width={width} height={height} style={{ width: "100%", height: "100%" }}>
        <Geographies geography={geo}>
          {({ geographies, path }) => (
            <>
              {geographies.map((g) => {
                const id = String(g.id);
                const disabled = disabledIds.has(id);
                return (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    onClick={() => handleClick(id)}
                    onMouseEnter={(e) => setHovered({ id, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setHovered((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: {
                        fill: disabled ? DISABLED_FILL : getFill(id),
                        stroke: "var(--color-bg)",
                        strokeWidth: 0.75,
                        outline: "none",
                        cursor: disabled ? "not-allowed" : "pointer",
                        transition: "fill 150ms ease, filter 150ms ease, transform 150ms ease",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      },
                      hover: disabled
                        ? {
                            fill: DISABLED_FILL,
                            stroke: "var(--color-bg)",
                            strokeWidth: 0.75,
                            outline: "none",
                            cursor: "not-allowed",
                          }
                        : {
                            fill: ACCENT,
                            stroke: "var(--color-bg)",
                            strokeWidth: 1,
                            outline: "none",
                            cursor: "pointer",
                            filter: `drop-shadow(0 0 10px ${ACCENT}) drop-shadow(0 0 22px color-mix(in srgb, ${ACCENT} 55%, transparent))`,
                            transform: "scale(1.035)",
                            transformBox: "fill-box",
                            transformOrigin: "center",
                          },
                      pressed: {
                        fill: disabled ? DISABLED_FILL : ACCENT_PRESSED,
                        stroke: "var(--color-bg)",
                        strokeWidth: 1,
                        outline: "none",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      },
                    }}
                  />
                );
              })}

              {geographies.map((g) => {
                const centroid = path.centroid(g);
                if (!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) return null;
                const disabled = disabledIds.has(String(g.id));
                return (
                  <text
                    key={`label-${g.rsmKey}`}
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    // Inline SVG <text> can't take Tailwind classes, and a
                    // 9px map label is well below `caption` by necessity —
                    // there's no room for anything bigger on a 시/도-sized
                    // polygon (see tailwind.config.ts's fontSize comment).
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      fill: disabled ? "var(--color-text-tertiary)" : "var(--color-text)",
                      stroke: "color-mix(in srgb, var(--color-bg) 65%, transparent)",
                      strokeWidth: 2,
                      paintOrder: "stroke",
                      pointerEvents: "none",
                    }}
                  >
                    {(g.properties as KrMapFeatureProps).name.replace(/(특별자치|광역|특별)?(시|도)$/, "")}
                  </text>
                );
              })}
            </>
          )}
        </Geographies>
      </ComposableMap>

      {hovered && (
        <div
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md px-3 py-1.5 text-caption font-semibold text-text shadow-lg"
          style={{ left: hovered.x + 14, top: hovered.y + 14, background: "color-mix(in srgb, var(--color-bg) 95%, transparent)", border: `1px solid ${ACCENT}` }}
        >
          {getLabel(hovered.id)}
        </div>
      )}
    </div>
  );
}
