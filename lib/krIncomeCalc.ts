// KR income lookups for the /kr section — deliberately NOT the same shape as
// lib/usIncomeCalc.ts. The US site has real Census percentile-anchor tables
// per state/county (see lib/percentileTable.ts's log-log interpolation); all
// we have for Korea is one average value per region (data/kr/regionIncome.json)
// with no published distribution underneath it.
//
// So this file leans on two honestly-different numbers instead of one fake
// "percentile":
//  1. ratioToMeanPercent — "your income ÷ this region's average", the one
//     number here that's directly backed by real KOSIS/국세청 data with no
//     assumption layered on top.
//  2. estimateTopPercentLogNormal — a secondary, clearly-labeled *estimate*
//     that assumes income within a region is log-normally distributed around
//     that same mean (sigma = 0.6, a typical value for South Korean household
//     income dispersion — see the constant below). Every caller that shows
//     this number must also show the disclaimer text (lib/i18n.ts's
//     krEstimatedPercentileDisclaimer) — never present it as if it came from
//     an actual 국세청 분위 table the way /us's percentiles do.
import regionIncomeData from "@/data/kr/regionIncome.json";
import { KR_SIDO, KR_GU, getSidoBySlug, getSidoByName, getGuBySlug, getGusForSidoSlug, type SidoMeta, type GuMeta } from "@/data/kr/regionMeta";
import { clampDisplayPercent } from "@/lib/percentileTable";

export type KrRegionLevel = "national" | "sido" | "gu";

export type KrRegionIncome = {
  name: string;
  level: KrRegionLevel;
  parent?: string;
  mean: number; // 만원, pre-tax annual average
};

const REGIONS = regionIncomeData.regions as KrRegionIncome[];
const regionByName = new Map(REGIONS.map((r) => [r.name, r]));

export const krRegionIncomeMeta = regionIncomeData.meta;

export function getNationalIncome(): KrRegionIncome {
  const national = regionByName.get("전국");
  if (!national) throw new Error("data/kr/regionIncome.json is missing the 전국 row");
  return national;
}

export function getRegionIncomeByName(name: string): KrRegionIncome | null {
  return regionByName.get(name) ?? null;
}

export function getSidoIncome(sidoSlug: string): { meta: SidoMeta; income: KrRegionIncome } | null {
  const meta = getSidoBySlug(sidoSlug);
  if (!meta || !meta.available) return null;
  const income = getRegionIncomeByName(meta.name);
  return income ? { meta, income } : null;
}

export function getGuIncome(guSlug: string): { meta: GuMeta; income: KrRegionIncome } | null {
  const meta = getGuBySlug(guSlug);
  if (!meta || !meta.available) return null;
  const income = getRegionIncomeByName(meta.name);
  return income ? { meta, income } : null;
}

// Every available 구/시 under a 시도, each paired with its income row — used
// by /kr/[region] to render the 구 picker list. Skips "준비중" 구 entirely
// (see KrGeoList's caller for how those get listed as disabled instead).
export function getAvailableGusForSido(sidoSlug: string): { meta: GuMeta; income: KrRegionIncome }[] {
  return getGusForSidoSlug(sidoSlug)
    .filter((g) => g.available)
    .map((meta) => ({ meta, income: regionByName.get(meta.name)! }))
    .filter((row) => row.income != null);
}

export function getPendingGusForSido(sidoSlug: string): GuMeta[] {
  return getGusForSidoSlug(sidoSlug).filter((g) => !g.available);
}

export function getAvailableSidoList(): { meta: SidoMeta; income: KrRegionIncome }[] {
  return KR_SIDO.filter((s) => s.available)
    .map((meta) => ({ meta, income: regionByName.get(meta.name)! }))
    .filter((row) => row.income != null);
}

export function getPendingSidoList(): SidoMeta[] {
  return KR_SIDO.filter((s) => !s.available);
}

// ── Ratio-to-average — the headline number, backed by nothing but real data ──
// e.g. 123.4 means "23.4% above this region's average", 80 means "20% below".
export function ratioToMeanPercent(annualIncomeManwon: number, meanManwon: number): number {
  if (meanManwon <= 0) return 0;
  return Math.round((annualIncomeManwon / meanManwon) * 1000) / 10;
}

// ── Log-normal estimate — secondary, always-disclosed ───────────────────────
// A typical dispersion for South Korean individual wage income (KOSIS wage
// structure surveys generally put the log-SD of employee earned income
// somewhere around 0.55–0.65) — not derived from this site's own data, since
// we only have one mean per region, not a real distribution. Kept as a module
// constant (not hardcoded inline) so every caller uses the same assumption
// and it's obvious from one place how to tune it later if better dispersion
// data ever becomes available per-region.
export const KR_LOGNORMAL_SIGMA = 0.6;

// Abramowitz & Stegun 7.1.26 — a ~1.5e-7 max-error erf approximation, plenty
// for a number we're already disclosing as a rough estimate.
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Assumes annual income within the region is Log-Normal(mu, sigma) with mean
// `meanManwon` (so mu = ln(mean) - sigma²/2, the standard mean-preserving
// log-normal parameterization), then returns "top X%" for `annualIncomeManwon`
// under that assumption. Clamped to the same [0.1, 99.9] band
// lib/percentileTable.ts's real anchor-table percentiles use, purely so the
// two numbers read on a comparable scale — this is still an estimate, not an
// anchor-table lookup.
export function estimateTopPercentLogNormal(
  annualIncomeManwon: number,
  meanManwon: number,
  sigma: number = KR_LOGNORMAL_SIGMA
): number {
  if (annualIncomeManwon <= 0 || meanManwon <= 0) return 50;
  const mu = Math.log(meanManwon) - (sigma * sigma) / 2;
  const z = (Math.log(annualIncomeManwon) - mu) / sigma;
  const percentBelow = normalCdf(z) * 100;
  const topPercent = 100 - percentBelow;
  return Math.min(99.9, Math.max(0.1, topPercent));
}

export type KrIncomeComparisonRow = {
  level: KrRegionLevel;
  name: string;
  mean: number;
  ratioPercent: number;
  estimatedTopPercent: number; // display-clamped 1-99, see clampDisplayPercent
};

function toRow(level: KrRegionLevel, region: KrRegionIncome, annualIncomeManwon: number): KrIncomeComparisonRow {
  return {
    level,
    name: region.name,
    mean: region.mean,
    ratioPercent: ratioToMeanPercent(annualIncomeManwon, region.mean),
    estimatedTopPercent: clampDisplayPercent(estimateTopPercentLogNormal(annualIncomeManwon, region.mean)),
  };
}

// National + (optional) sido + (optional) gu comparison rows for a given
// income — the most-specific available row (gu > sido > national) is what
// callers should headline; the rest is the "see full breakdown" table.
export function buildKrIncomeComparison(
  annualIncomeManwon: number,
  sidoSlug: string | null,
  guSlug: string | null
): KrIncomeComparisonRow[] {
  const rows: KrIncomeComparisonRow[] = [toRow("national", getNationalIncome(), annualIncomeManwon)];

  const sido = sidoSlug ? getSidoIncome(sidoSlug) : null;
  if (sido) rows.push(toRow("sido", sido.income, annualIncomeManwon));

  const gu = guSlug ? getGuIncome(guSlug) : null;
  if (gu) rows.push(toRow("gu", gu.income, annualIncomeManwon));

  return rows;
}

export function getMostSpecificKrComparison(rows: KrIncomeComparisonRow[]): KrIncomeComparisonRow {
  return rows[rows.length - 1];
}
