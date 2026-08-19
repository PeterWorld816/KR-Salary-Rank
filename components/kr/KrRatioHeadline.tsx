"use client";
// The "평균보다 X% 높아요/낮아요" headline, shared by KrResultCard.tsx and
// KrResultDashboard.tsx. Counts up from 0 on mount (lib/useCountUp.ts, which
// already no-ops under prefers-reduced-motion) so the number reads as a
// small reveal instead of popping in static. Not used by KrShareCard.tsx —
// that card gets rasterized the instant it's mounted, so an in-flight
// animation would just get captured mid-count.
import { formatTemplate, translations } from "@/lib/i18n";
import { useCountUp } from "@/lib/useCountUp";

export default function KrRatioHeadline({ ratioPercent }: { ratioPercent: number }) {
  const t = translations.ko;
  const above = ratioPercent >= 100;
  const target = Math.abs(Math.round((ratioPercent - 100) * 10) / 10);
  const displayed = useCountUp(target);

  return (
    <div className="text-display leading-none text-warn">
      {formatTemplate(above ? t.krRatioAboveTemplate : t.krRatioBelowTemplate, { percent: displayed.toFixed(1) })}
    </div>
  );
}
