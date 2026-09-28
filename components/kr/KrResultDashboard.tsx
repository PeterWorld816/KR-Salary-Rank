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
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, ChevronLeft, LockKeyhole, MapPin, Sparkles } from "lucide-react";
import { formatTemplate, translations, type Translations } from "@/lib/i18n";
import { getSidoBySlug, getGuBySlug } from "@/data/kr/regionMeta";
import { buildKrIncomeComparison, getMostSpecificKrComparison, krRegionIncomeMeta, type KrIncomeComparisonRow } from "@/lib/krIncomeCalc";
import { formatManwon } from "@/lib/krFormat";
import { buildKrOccupationComparison } from "@/lib/krOccupation";
import DistributionChart from "@/components/DistributionChart";
import TierBadge from "@/components/TierBadge";
import KrRatioHeadline from "@/components/kr/KrRatioHeadline";
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
  const occupation = buildKrOccupationComparison(input.annualIncome, input.occupationId);
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

        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-display text-balance">{t.krDashboardIncomeSectionTitle}</h1>
            <p className="mt-1 max-w-xl text-body text-text-secondary">{t.krResultDashboardIntro}</p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-accent-line bg-accent-tint px-3 py-1.5 text-caption font-semibold text-accent sm:inline-flex">
            <LockKeyhole className="h-3.5 w-3.5" />
            내 브라우저에서만 계산
          </span>
        </div>

        <section
          aria-label="지역 평균 대비 소득 요약"
          className="relative isolate mb-6 overflow-hidden rounded-[28px] border border-accent-line p-5 shadow-lg sm:p-7"
          style={{
            background:
              "radial-gradient(circle at 90% 0%, rgba(52,211,153,0.18), transparent 34%), radial-gradient(circle at 0% 100%, rgba(251,191,36,0.08), transparent 34%), linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
          }}
        >
          <div className="relative">
            <div className="mb-7 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-subtle px-3 py-1.5 text-caption font-semibold text-text-secondary">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                {best.name} 기준
              </span>
              <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                <Sparkles className="h-3.5 w-3.5 text-warn" />
                내 소득 리포트
              </span>
            </div>

            <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-w-0">
                <TierBadge tier={getTier(best.estimatedTopPercent)} className="mb-3" />
                <KrRatioHeadline ratioPercent={best.ratioPercent} size="hero" />
                <p className="mt-2 text-body font-semibold text-text-secondary">
                  {formatTemplate(t.krRatioHeroLabelTemplate, { region: best.name })}
                </p>
              </div>
              <div className="mx-auto w-full max-w-[260px] rounded-2xl border border-border bg-bg-subtle/70 px-3 py-2 sm:max-w-none">
                <DistributionChart
                  monthlySalary={input.annualIncome}
                  width={220}
                  dark
                  min={CHART_MIN}
                  max={CHART_MAX}
                  averageValue={best.mean}
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div className="rounded-2xl bg-bg-subtle/70 px-4 py-3">
                <p className="text-caption text-text-tertiary">내가 입력한 연봉</p>
                <p className="mt-1 text-title font-bold tabular-nums text-text">{formatManwon(input.annualIncome)}</p>
              </div>
              <div className="rounded-2xl bg-bg-subtle/70 px-4 py-3">
                <p className="text-caption text-text-tertiary">{best.name} 평균 연봉</p>
                <p className="mt-1 text-title font-bold tabular-nums text-text">{formatManwon(best.mean)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warn-line bg-warn-tint px-4 py-4">
          <span className="mt-0.5 rounded-xl bg-warn-tint p-2 text-warn"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="text-caption font-bold text-warn">
              {formatTemplate(t.topPercentTemplate, { percent: best.estimatedTopPercent })} · {t.krEstimatedPercentileLabel}
            </p>
            <p className="mt-1 text-caption leading-relaxed text-text-secondary">{t.krEstimatedPercentileDisclaimer}</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-border bg-surface px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-caption font-semibold text-text-secondary">
              <BriefcaseBusiness className="h-4 w-4 text-accent" />
              {occupation.occupation.name}
            </p>
            <span className="rounded-full border border-border px-2.5 py-1 text-caption text-text-tertiary">직업군 참고치</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-title text-text">
              {occupation.ratioPercent}% {t.krOccupationAverageLabel}
            </strong>
            <span className="text-caption text-text-tertiary">
              {formatManwon(occupation.occupation.mean)} {t.krOccupationMeanLabel}
            </span>
          </div>
          <p className="mt-1 text-caption text-text-tertiary">
            {formatTemplate(t.topPercentTemplate, { percent: occupation.estimatedTopPercent })} ({t.krEstimatedPercentileLabel})
          </p>
          <p className="mt-2 text-caption text-text-tertiary">{t.krOccupationDisclaimer}</p>
        </div>

        <KrShareCard
          cardRef={shareCardRef}
          variant="wide"
          regionName={best.name}
          annualIncome={input.annualIncome}
          averageValue={best.mean}
          ratioPercent={best.ratioPercent}
          estimatedTopPercent={best.estimatedTopPercent}
        />
        <KrShareCard
          cardRef={storyCardRef}
          variant="story"
          regionName={best.name}
          annualIncome={input.annualIncome}
          averageValue={best.mean}
          ratioPercent={best.ratioPercent}
          estimatedTopPercent={best.estimatedTopPercent}
        />
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-title font-bold text-text">이 결과, 친구에게 보여줄까요?</h2>
            <p className="mt-1 text-caption text-text-tertiary">카드에는 입력한 연봉과 지역 평균이 표시돼요.</p>
          </div>
          <Sparkles className="mb-1 h-5 w-5 shrink-0 text-warn" />
        </div>
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

        <h2 className="mb-3 text-title font-bold text-text">{t.krCompareChartTitle}</h2>
        <dl className="mb-8 divide-y divide-border rounded-2xl border border-border bg-surface px-4">
          {rows.map((row) => (
            <div key={row.level} className="flex items-center gap-3 py-4">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${row.level === best.level ? "bg-accent-tint text-accent" : "bg-bg-subtle text-text-tertiary"}`}>
                {row.ratioPercent >= 100 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </span>
              <dt className="min-w-0 flex-1">
                <span className="block text-caption font-semibold text-text">{levelLabel(row.level, t)}</span>
                <span className="block truncate text-caption text-text-tertiary">{row.name}</span>
              </dt>
              <dd className="shrink-0 text-right">
                <div className="text-body font-bold tabular-nums text-text">{formatManwon(row.mean)}</div>
                <div className={`text-caption tabular-nums ${row.level === best.level ? "font-semibold text-accent" : "text-text-tertiary"}`}>
                  평균 대비 {row.ratioPercent}%
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
