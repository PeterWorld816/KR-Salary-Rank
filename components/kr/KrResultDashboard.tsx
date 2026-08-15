"use client";
// Full result dashboard for /kr/result — the /kr equivalent of
// components/us/result/PersonalizedResult.tsx, scoped to what /kr actually
// has: a ratio-to-average headline (real data) plus a clearly-disclosed
// log-normal percentile estimate, compared at up to three levels (national /
// 시·도 / 시군구). No age-band, net-worth, or 401(k) sections — there's no KR
// data behind any of those yet.
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageProvider";
import { formatTemplate } from "@/lib/i18n";
import { getSidoBySlug, getGuBySlug } from "@/data/kr/regionMeta";
import { buildKrIncomeComparison, getMostSpecificKrComparison, krRegionIncomeMeta, type KrIncomeComparisonRow } from "@/lib/krIncomeCalc";
import { formatManwon } from "@/lib/krFormat";
import DistributionChart from "@/components/DistributionChart";
import TierBadge from "@/components/TierBadge";
import { getTier } from "@/lib/tier";
import KrInputPanel, { readKrInputFromSearch } from "@/components/kr/KrInputPanel";
import KrShell from "@/components/kr/KrShell";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";

const CHART_MIN = 1500;
const CHART_MAX = 15000;

function levelLabel(level: KrIncomeComparisonRow["level"], t: ReturnType<typeof useLanguage>["t"]): string {
  if (level === "national") return t.krNationalLabel;
  if (level === "sido") return t.krSidoLabel;
  return t.krGuLabel;
}

function KrResultDashboardContent() {
  const { t, lang } = useLanguage();
  const sp = useSearchParams();
  const input = readKrInputFromSearch(sp);
  const sidoSlug = sp.get("region");
  const guSlug = sp.get("gu");

  const sido = sidoSlug ? getSidoBySlug(sidoSlug) : null;
  const gu = guSlug ? getGuBySlug(guSlug) : null;

  if (!sido || !sido.available) {
    return (
      <KrShell>
        <KrInputPanel />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h1 className="mb-2 text-[22px] font-extrabold tracking-tight">{t.krResultMissingTitle}</h1>
          <p className="mb-6 text-[14px] text-white/55">{t.krResultMissingDesc}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#34D399] px-5 py-2.5 text-[14px] font-bold text-[#04120C] transition-opacity hover:opacity-90"
          >
            {t.krResultMissingCta}
          </Link>
          <Footer />
        </div>
      </KrShell>
    );
  }

  const rows = buildKrIncomeComparison(input.annualIncome, sido.slug, gu && gu.parentSlug === sido.slug ? gu.slug : null);
  const best = getMostSpecificKrComparison(rows);
  const above = best.ratioPercent >= 100;
  const backHref = "/" + (sp.toString() ? `?${sp.toString()}` : "");

  return (
    <KrShell>
      <KrInputPanel />
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-1 text-[13px] text-white/50 transition-colors hover:text-white/80">
          <ChevronLeft className="h-4 w-4" />
          {t.krBackToKrMap}
        </Link>

        <h1 className="mb-2 text-[26px] font-extrabold tracking-tight text-balance">{t.krDashboardIncomeSectionTitle}</h1>
        <p className="mb-6 max-w-xl text-[15px] text-white/55">{t.krResultDashboardIntro}</p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-nowrap">
          <div className="flex min-w-0 flex-col items-start gap-1">
            <TierBadge tier={getTier(best.estimatedTopPercent)} />
            <div className="text-[32px] font-extrabold leading-none tracking-tight text-[#FBBF24]">
              {formatTemplate(above ? t.krRatioAboveTemplate : t.krRatioBelowTemplate, {
                percent: Math.abs(Math.round((best.ratioPercent - 100) * 10) / 10),
              })}
            </div>
            <p className="text-[12px] font-semibold text-white/60">{formatTemplate(t.krRatioHeroLabelTemplate, { region: best.name })}</p>
          </div>
          <div className="shrink-0">
            <DistributionChart monthlySalary={input.annualIncome} width={220} lang={lang} dark min={CHART_MIN} max={CHART_MAX} averageValue={best.mean} />
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/[0.06] px-4 py-3">
          <p className="text-[12px] font-semibold text-[#FBBF24]">
            {formatTemplate(t.topPercentTemplate, { percent: best.estimatedTopPercent })} · {t.krEstimatedPercentileLabel}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/55">{t.krEstimatedPercentileDisclaimer}</p>
        </div>

        <h2 className="mb-3 text-[15px] font-bold text-white/90">{t.krCompareChartTitle}</h2>
        <dl className="mb-8 divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.02] px-4">
          {rows.map((row) => (
            <div key={row.level} className="flex items-center justify-between py-3">
              <dt className="text-[13px] font-medium text-white/70">
                {levelLabel(row.level, t)} <span className="text-white/40">· {row.name}</span>
              </dt>
              <dd className="text-right">
                <div className="text-[14px] font-bold tabular-nums text-white">{formatManwon(row.mean)}</div>
                <div className="text-[11px] tabular-nums text-white/40">
                  {row.ratioPercent}% · {formatTemplate(t.topPercentTemplate, { percent: row.estimatedTopPercent })}
                </div>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mb-1 text-[12px] text-white/40">{formatTemplate(t.krSourceLabelTemplate, { asOf: krRegionIncomeMeta.asOf })}</p>
        <p className="mb-1 text-[12px] text-white/30">{t.krDisclaimer}</p>
        <p className="text-[12px] text-white/25">🔒 {t.privacyNotice}</p>

        <Footer />
      </div>
    </KrShell>
  );
}

export default function KrResultDashboard() {
  return (
    <Suspense
      fallback={
        <KrShell>
          <div className="flex min-h-screen items-center justify-center">
            <Spinner className="h-8 w-8 border-[3px] border-white/20 border-t-[#34D399]" />
          </div>
        </KrShell>
      }
    >
      <KrResultDashboardContent />
    </Suspense>
  );
}
