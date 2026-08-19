"use client";
// Full result dashboard for /kr/result — the /kr equivalent of
// components/us/result/PersonalizedResult.tsx, scoped to what /kr actually
// has: a ratio-to-average headline (real data) plus a clearly-disclosed
// log-normal percentile estimate, compared at up to three levels (national /
// 시·도 / 시군구). No age-band, net-worth, or 401(k) sections — there's no KR
// data behind any of those yet.
import { Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { formatTemplate, translations, type Translations } from "@/lib/i18n";
import { getSidoBySlug, getGuBySlug } from "@/data/kr/regionMeta";
import { buildKrIncomeComparison, getMostSpecificKrComparison, krRegionIncomeMeta, type KrIncomeComparisonRow } from "@/lib/krIncomeCalc";
import { formatManwon } from "@/lib/krFormat";
import DistributionChart from "@/components/DistributionChart";
import TierBadge from "@/components/TierBadge";
import { getTier } from "@/lib/tier";
import KrInputPanel, { readKrInputFromSearch } from "@/components/kr/KrInputPanel";
import KrShell from "@/components/kr/KrShell";
import KrShareCard, {
  KR_SHARE_CARD_WIDTH,
  KR_SHARE_CARD_HEIGHT,
  KR_STORY_CARD_WIDTH,
  KR_STORY_CARD_HEIGHT,
} from "@/components/kr/KrShareCard";
import ShareButtons from "@/components/ShareButtons";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";

const CHART_MIN = 1500;
const CHART_MAX = 15000;

function levelLabel(level: KrIncomeComparisonRow["level"], t: Translations): string {
  if (level === "national") return t.krNationalLabel;
  if (level === "sido") return t.krSidoLabel;
  return t.krGuLabel;
}

function KrResultDashboardContent() {
  const t = translations.ko;
  const sp = useSearchParams();
  const input = readKrInputFromSearch(sp);
  const sidoSlug = sp.get("region");
  const guSlug = sp.get("gu");
  const shareCardRef = useRef<HTMLDivElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);

  const sido = sidoSlug ? getSidoBySlug(sidoSlug) : null;
  const gu = guSlug ? getGuBySlug(guSlug) : null;

  if (!sido || !sido.available) {
    return (
      <KrShell>
        <KrInputPanel />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h1 className="mb-2 text-display">{t.krResultMissingTitle}</h1>
          <p className="mb-6 text-body text-text-secondary">{t.krResultMissingDesc}</p>
          <Link
            href="/"
            className="touch-target inline-flex items-center gap-1.5 rounded-full bg-accent px-5 text-body font-bold text-on-accent transition-opacity hover:opacity-90"
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
  const downloadName = `income-rank-${sido.slug}${gu ? `-${gu.slug}` : ""}.png`;

  return (
    <KrShell>
      <KrInputPanel />
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-1 text-caption text-text-secondary transition-colors hover:text-text">
          <ChevronLeft className="h-4 w-4" />
          {t.krBackToKrMap}
        </Link>

        <h1 className="mb-2 text-display text-balance">{t.krDashboardIncomeSectionTitle}</h1>
        <p className="mb-6 max-w-xl text-body text-text-secondary">{t.krResultDashboardIntro}</p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 sm:flex-nowrap">
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
            <DistributionChart monthlySalary={input.annualIncome} width={220} dark min={CHART_MIN} max={CHART_MAX} averageValue={best.mean} />
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-warn-line bg-warn-tint px-4 py-3">
          <p className="text-caption font-semibold text-warn">
            {formatTemplate(t.topPercentTemplate, { percent: best.estimatedTopPercent })} · {t.krEstimatedPercentileLabel}
          </p>
          <p className="mt-1 text-caption leading-relaxed text-text-secondary">{t.krEstimatedPercentileDisclaimer}</p>
        </div>

        <KrShareCard
          cardRef={shareCardRef}
          variant="wide"
          regionName={best.name}
          monthlySalary={input.annualIncome}
          averageValue={best.mean}
          ratioPercent={best.ratioPercent}
          estimatedTopPercent={best.estimatedTopPercent}
        />
        <KrShareCard
          cardRef={storyCardRef}
          variant="story"
          regionName={best.name}
          monthlySalary={input.annualIncome}
          averageValue={best.mean}
          ratioPercent={best.ratioPercent}
          estimatedTopPercent={best.estimatedTopPercent}
        />
        <div className="mb-8">
          <ShareButtons
            cardRef={shareCardRef}
            shareTitle={t.krAppTitle}
            shareText={formatTemplate(t.krShareTextTemplate, { region: best.name, percent: best.estimatedTopPercent })}
            downloadName={downloadName}
            width={KR_SHARE_CARD_WIDTH}
            height={KR_SHARE_CARD_HEIGHT}
            storyCardRef={storyCardRef}
            storyWidth={KR_STORY_CARD_WIDTH}
            storyHeight={KR_STORY_CARD_HEIGHT}
            enableKakao
          />
        </div>

        <h2 className="mb-3 text-title text-text">{t.krCompareChartTitle}</h2>
        <dl className="mb-8 divide-y divide-border rounded-xl border border-border bg-surface px-4">
          {rows.map((row) => (
            <div key={row.level} className="flex items-center justify-between py-3">
              <dt className="text-caption font-medium text-text-secondary">
                {levelLabel(row.level, t)} <span className="text-text-tertiary">· {row.name}</span>
              </dt>
              <dd className="text-right">
                <div className="text-body font-bold tabular-nums text-text">{formatManwon(row.mean)}</div>
                <div className="text-caption tabular-nums text-text-tertiary">
                  {row.ratioPercent}% · {formatTemplate(t.topPercentTemplate, { percent: row.estimatedTopPercent })}
                </div>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mb-1 text-caption text-text-tertiary">{formatTemplate(t.krSourceLabelTemplate, { asOf: krRegionIncomeMeta.asOf })}</p>
        <p className="mb-1 text-caption text-text-tertiary">{t.krDisclaimer}</p>
        <p className="text-caption text-text-tertiary">🔒 {t.privacyNotice}</p>

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
            <Spinner className="h-8 w-8 border-[3px] border-border-strong border-t-accent" />
          </div>
        </KrShell>
      }
    >
      <KrResultDashboardContent />
    </Suspense>
  );
}
