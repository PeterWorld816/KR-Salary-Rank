// Maps a "top N%" number (the same lower-is-better percentile used across
// income/net-worth results) to a gamified tier badge. Pure function, no
// React — safe to reuse in the result page and any future share card.
//
// This site is Korea-only now (no /us route — see git history's "Consolidate
// site to Korea-only, drop /kr prefix"), so these labels are plain Korean
// rather than a lang-keyed map. If an English-language section is ever
// reintroduced, split TIER_LEVELS/FALLBACK_TIER into a Record<LangCode, ...>
// (lib/i18n.ts's LangCode) instead of hardcoding Korean here.

export type TierColor = "gold" | "mint";

export type Tier = {
  emoji: string;
  label: string;
  color: TierColor;
};

const TIER_LEVELS: { max: number; emoji: string; label: string; color: TierColor }[] = [
  { max: 1, emoji: "🏆", label: "정상급 소득자", color: "gold" },
  { max: 5, emoji: "💎", label: "상위권 리더", color: "gold" },
  { max: 15, emoji: "🚀", label: "고속 성장 중", color: "gold" },
  { max: 35, emoji: "📈", label: "쭉쭉 오르는 중", color: "mint" },
  { max: 60, emoji: "🌱", label: "꾸준히 크는 중", color: "mint" },
  { max: 85, emoji: "🔧", label: "기반 다지는 중", color: "mint" },
];

const FALLBACK_TIER: Tier = { emoji: "🌟", label: "이제 시작이에요", color: "mint" };

export function getTier(topPercent: number): Tier {
  const level = TIER_LEVELS.find((l) => topPercent <= l.max);
  return level ? { emoji: level.emoji, label: level.label, color: level.color } : FALLBACK_TIER;
}
