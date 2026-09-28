// Off-screen, fixed-size result card rasterized by components/ShareButtons.tsx
// (html-to-image needs a concrete pixel width/height, not a responsive
// Tailwind layout, to produce a clean PNG). Two variants — a wide feed card
// and a 9:16 story card — both carry the tier badge, ratio headline, region
// name, and site name/domain so a saved screenshot still credits the source
// after it's reposted elsewhere.
import type { RefObject } from "react";
import { formatTemplate, translations } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";
import { formatManwon } from "@/lib/krFormat";
import DistributionChart from "@/components/DistributionChart";
import TierBadge from "@/components/TierBadge";
import { getTier } from "@/lib/tier";

export const KR_SHARE_CARD_WIDTH = 400;
export const KR_SHARE_CARD_HEIGHT = 540;
export const KR_STORY_CARD_WIDTH = 405;
export const KR_STORY_CARD_HEIGHT = 720;

const CHART_MIN = 1500;
const CHART_MAX = 15000;

function siteDomain(): string {
  return getSiteUrl().replace(/^https?:\/\//, "");
}

export default function KrShareCard({
  cardRef,
  variant,
  regionName,
  annualIncome,
  averageValue,
  ratioPercent,
  estimatedTopPercent,
}: {
  cardRef: RefObject<HTMLDivElement>;
  variant: "wide" | "story";
  regionName: string;
  annualIncome: number;
  averageValue: number;
  ratioPercent: number;
  estimatedTopPercent: number;
}) {
  const t = translations.ko;
  const tier = getTier(estimatedTopPercent);
  const above = ratioPercent >= 100;
  const isStory = variant === "story";
  const width = isStory ? KR_STORY_CARD_WIDTH : KR_SHARE_CARD_WIDTH;
  const height = isStory ? KR_STORY_CARD_HEIGHT : KR_SHARE_CARD_HEIGHT;
  const chartWidth = isStory ? 260 : 200;
  const difference = Math.abs(Math.round((ratioPercent - 100) * 10) / 10);

  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      // Off-screen, not display:none — html-to-image needs the node laid
      // out and actually painted in order to rasterize it.
      className="flex flex-col justify-between overflow-hidden rounded-[32px] border border-accent-line p-7 text-text"
      style={{
        position: "fixed",
        top: 0,
        left: "-9999px",
        width,
        height,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 90% 4%, rgba(52,211,153,0.22), transparent 32%), radial-gradient(circle at 4% 88%, rgba(251,191,36,0.12), transparent 32%), linear-gradient(145deg, #111A18 0%, #0B0C0E 56%, #121412 100%)",
      }}
    >
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="text-caption font-bold tracking-tight text-text">{t.krAppTitle}</p>
          <p className="truncate text-caption font-semibold text-text-tertiary">연봉 밸런스 · KOREA</p>
        </div>
        <span className="shrink-0 rounded-full border border-accent-line bg-accent-tint px-3 py-1 text-caption font-bold text-accent">나의 리포트</span>
      </div>

      <div className={`flex flex-1 flex-col items-center justify-center ${isStory ? "gap-4 py-3" : "gap-1 py-0"}`}>
        <span className="rounded-full border border-border bg-bg-subtle px-3 py-1.5 text-caption font-semibold text-text-secondary">
          🇰🇷 {regionName} 평균과 비교
        </span>
        <TierBadge tier={tier} />
        <div className="text-center">
          <p className={`text-share-hero tabular-nums ${ratioPercent === 100 ? "text-text-secondary" : above ? "text-accent" : "text-warn"}`}>
            {difference.toFixed(1)}%
          </p>
          <p className="mt-1 text-title font-bold text-text">
            {ratioPercent === 100 ? t.krRatioEqualText : above ? "평균보다 높아요" : "평균보다 낮아요"}
          </p>
        </div>
        <DistributionChart
          monthlySalary={annualIncome}
          width={chartWidth}
          dark
          min={CHART_MIN}
          max={CHART_MAX}
          averageValue={averageValue}
        />
        <p className="rounded-full border border-warn-line bg-warn-tint px-3 py-1.5 text-caption font-semibold text-warn">
          {formatTemplate(t.topPercentTemplate, { percent: estimatedTopPercent })} · 분포 가정 추정치
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-1 rounded-xl border border-border bg-bg-subtle px-3 py-2">
          <p className="text-caption text-text-tertiary">내 연봉</p>
          <p className="text-caption font-bold tabular-nums text-text">{formatManwon(annualIncome)}</p>
        </div>
        <div className="flex items-center justify-between gap-1 rounded-xl border border-border bg-bg-subtle px-3 py-2">
          <p className="text-caption text-text-tertiary">지역 평균</p>
          <p className="text-caption font-bold tabular-nums text-text">{formatManwon(averageValue)}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 pt-1">
          <span className="text-caption font-semibold text-text-secondary">{t.krMastheadTagline}</span>
          <span className="text-caption text-text-tertiary">{siteDomain()}</span>
        </div>
      </div>
    </div>
  );
}
