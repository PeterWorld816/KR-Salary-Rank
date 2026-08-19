"use client";
// Thin horizontal card shown at the top of every /kr picker page (home,
// /kr/[region]) — the ratio-to-average headline plus a small distribution
// chart, mirroring the role components/us/result/CompactResultCard.tsx plays
// for /us. Deliberately headlines the ratio (backed by real KOSIS/국세청
// data), not the estimated percentile — see lib/krIncomeCalc.ts's top-of-file
// comment for why those two numbers carry different weight here.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatTemplate, translations } from "@/lib/i18n";
import DistributionChart from "@/components/DistributionChart";
import TierBadge from "@/components/TierBadge";
import { getTier } from "@/lib/tier";
import KrInputPanel, { readKrInputFromSearch } from "@/components/kr/KrInputPanel";
import Spinner from "@/components/Spinner";
import { buildKrIncomeComparison, getMostSpecificKrComparison } from "@/lib/krIncomeCalc";

const CHART_WIDTH = 200;
const CHART_MIN = 1500; // 만원
const CHART_MAX = 15000; // 만원

function KrResultCardInner({ presetSidoSlug, presetGuSlug }: { presetSidoSlug: string | null; presetGuSlug: string | null }) {
  const t = translations.ko;
  const sp = useSearchParams();
  const input = readKrInputFromSearch(sp);

  const rows = buildKrIncomeComparison(input.annualIncome, presetSidoSlug, presetGuSlug);
  const best = getMostSpecificKrComparison(rows);
  const above = best.ratioPercent >= 100;
  // No region picked yet (home screen's first paint) — the card below is
  // still a real, honest number (전국 평균 대비 실측치), but nothing about it
  // is personalized yet, so it's flagged as a preview rather than presented
  // as a finished result.
  const isPreview = !presetSidoSlug;

  return (
    <>
      <KrInputPanel />
      <div className="mx-auto max-w-2xl px-6 pt-8">
        {isPreview && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-caption font-bold uppercase tracking-wide text-text-tertiary">
              {t.krResultPreviewBadge}
            </span>
            <p className="text-caption text-text-tertiary">{t.krResultPreviewHint}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 sm:flex-nowrap">
          <div className="flex min-w-0 flex-col items-start gap-1">
            <TierBadge tier={getTier(best.estimatedTopPercent)} />
            <div className="text-display leading-none text-warn">
              {formatTemplate(above ? t.krRatioAboveTemplate : t.krRatioBelowTemplate, {
                percent: Math.abs(Math.round((best.ratioPercent - 100) * 10) / 10),
              })}
            </div>
            <p className="text-caption font-semibold text-text-secondary">{formatTemplate(t.krRatioHeroLabelTemplate, { region: best.name })}</p>
          </div>
          <div className="shrink-0">
            <DistributionChart
              monthlySalary={input.annualIncome}
              width={CHART_WIDTH}
              dark
              min={CHART_MIN}
              max={CHART_MAX}
              averageValue={best.mean}
            />
          </div>
        </div>
        <p className="mt-2 text-caption text-text-tertiary">
          {formatTemplate(t.topPercentTemplate, { percent: best.estimatedTopPercent })} ({t.krEstimatedPercentileLabel}) —{" "}
          {t.krEstimatedPercentileDisclaimer}
        </p>
      </div>
    </>
  );
}

export default function KrResultCard(props: { presetSidoSlug: string | null; presetGuSlug: string | null }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6 border-[3px] border-border-strong border-t-accent" />
        </div>
      }
    >
      <KrResultCardInner {...props} />
    </Suspense>
  );
}
