// Small "this color = this income range" key shown under the 시/도 choropleth
// — bands come from components/us/colorScale.ts (pure numeric min/max/value
// logic, no US-specific units) so they always match what KrMap painted.
import { buildIncomeScaleBands, NO_DATA_FILL } from "@/components/colorScale";
import { formatManwon } from "@/lib/krFormat";
import { translations } from "@/lib/i18n";

export default function KrIncomeLegend({ min, max }: { min: number; max: number }) {
  const t = translations.ko;
  const bands = buildIncomeScaleBands(min, max);
  if (bands.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
      {bands.map((band, i) => {
        const rangeLabel =
          i === 0
            ? `<${formatManwon(band.hiValue)}`
            : i === bands.length - 1
              ? `${formatManwon(band.loValue)}+`
              : `${formatManwon(band.loValue)}–${formatManwon(band.hiValue)}`;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: band.color }} />
            <span className="text-[10px] text-white/45">{rangeLabel}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-white/10" style={{ background: NO_DATA_FILL }} />
        <span className="text-[10px] text-white/45">{t.krLegendNoData}</span>
      </div>
    </div>
  );
}
