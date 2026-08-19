// Off-screen, fixed-size result card rasterized by components/ShareButtons.tsx
// (html-to-image needs a concrete pixel width/height, not a responsive
// Tailwind layout, to produce a clean PNG). Two variants — a wide feed card
// and a 9:16 story card — both carry the tier badge, ratio headline, region
// name, and site name/domain so a saved screenshot still credits the source
// after it's reposted elsewhere.
import type { RefObject } from "react";
import { formatTemplate, translations } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";
import DistributionChart from "@/components/DistributionChart";
import TierBadge from "@/components/TierBadge";
import { getTier } from "@/lib/tier";

export const KR_SHARE_CARD_WIDTH = 400;
export const KR_SHARE_CARD_HEIGHT = 520;
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
  monthlySalary,
  averageValue,
  ratioPercent,
  estimatedTopPercent,
}: {
  cardRef: RefObject<HTMLDivElement>;
  variant: "wide" | "story";
  regionName: string;
  monthlySalary: number;
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
  const chartWidth = isStory ? 300 : 260;

  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      // Off-screen, not display:none — html-to-image needs the node laid
      // out and actually painted in order to rasterize it.
      style={{ position: "fixed", top: 0, left: "-9999px", width, height, pointerEvents: "none" }}
      className="flex flex-col justify-between rounded-lg border border-border bg-bg p-7"
    >
      <div className="flex items-center justify-between">
        <span className="text-caption font-bold text-text">{t.krAppTitle}</span>
        <span className="text-caption text-text-tertiary">🇰🇷</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
        <TierBadge tier={tier} />
        <div className="text-display text-center leading-tight text-warn">
          {formatTemplate(above ? t.krRatioAboveTemplate : t.krRatioBelowTemplate, {
            percent: Math.abs(Math.round((ratioPercent - 100) * 10) / 10),
          })}
        </div>
        <p className="text-caption font-semibold text-text-secondary">
          {formatTemplate(t.krRatioHeroLabelTemplate, { region: regionName })}
        </p>
        <DistributionChart
          monthlySalary={monthlySalary}
          width={chartWidth}
          dark
          min={CHART_MIN}
          max={CHART_MAX}
          averageValue={averageValue}
        />
        <p className="text-caption font-semibold text-warn">
          {formatTemplate(t.topPercentTemplate, { percent: estimatedTopPercent })} · {t.krEstimatedPercentileLabel}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-caption text-text-secondary">{t.krMastheadTagline}</span>
        <span className="text-caption text-text-tertiary">{siteDomain()}</span>
      </div>
    </div>
  );
}
