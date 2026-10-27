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
import { KR_SIDO, getSidoBySlug, getGuBySlug, getGusForSidoSlug, type SidoMeta, type GuMeta } from "@/data/kr/regionMeta";
import { clampDisplayPercent } from "@/lib/percentileTable";

export type KrRegionLevel = "national" | "sido" | "gu";

export type KrRegionIncome = {
  name: string;
  level: KrRegionLevel;
  parent?: string;
  parentSlug?: string;
  slug?: string;
  code?: string;
  aggregation?: "city";
  mean: number; // 만원, pre-tax annual average
  source: string; // 출처명 — for estimates, how the value was derived
  year: number; // 귀속연도
  // true = no published figure for this exact area; `mean` is borrowed from
  // `estimateBasis` (a city-wide or 시/도 row) — see scripts/build-region-data.mjs.
  isEstimate: boolean;
  estimateMethod?: "city-mean" | "sido-mean";
  estimateBasis?: string; // slug of the city row, or the 시/도 slug
};

const REGIONS = regionIncomeData.regions as KrRegionIncome[];
const regionByName = new Map(REGIONS.filter((r) => r.level !== "gu").map((r) => [r.name, r]));
const regionBySlug = new Map(REGIONS.flatMap((r) => r.slug ? [[r.slug, r] as const] : []));

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
  const income = regionBySlug.get(meta.slug);
  return income ? { meta, income } : null;
}

// Every available 구/시 under a 시도, each paired with its income row — used
// by /kr/[region] to render the 구 picker list. Skips "준비중" 구 entirely
// (see KrGeoList's caller for how those get listed as disabled instead).
export function getAvailableGusForSido(sidoSlug: string): { meta: GuMeta; income: KrRegionIncome }[] {
  return getGusForSidoSlug(sidoSlug)
    .filter((g) => g.available)
    .map((meta) => ({ meta, income: regionBySlug.get(meta.slug) }))
    .filter((row): row is { meta: GuMeta; income: KrRegionIncome } => row.income != null);
}

export function getPendingGusForSido(sidoSlug: string): GuMeta[] {
  return getGusForSidoSlug(sidoSlug).filter((g) => !g.available);
}

// One-line explanation for the "추정" badge tooltip, or null for real values.
export function getEstimateNote(region: KrRegionIncome): string | null {
  if (!region.isEstimate) return null;
  const basisName =
    region.estimateMethod === "city-mean"
      ? regionBySlug.get(region.estimateBasis ?? "")?.name
      : getSidoBySlug(region.estimateBasis ?? "")?.name;
  return `${region.name}만의 공식 통계가 없어 ${basisName ?? "상위 지역"} 전체 평균(${region.year}년 귀속)을 그대로 표시한 추정치예요.`;
}

export function getAvailableSidoList():{ meta: SidoMeta; income: KrRegionIncome }[] {
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

// Acklam's rational approximation of the standard normal quantile (~1e-9
// relative error) — the inverse of normalCdf above.
function inverseNormalCdf(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) return -inverseNormalCdf(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// Inverse of estimateTopPercentLogNormal: the annual income (만원) that would
// sit at "top `topPercent`%" under the same log-normal assumption. Same
// disclosure rules apply — it's an estimate, not a published cutoff.
export function estimateIncomeAtTopPercent(
  topPercent: number,
  meanManwon: number,
  sigma: number = KR_LOGNORMAL_SIGMA
): number {
  const mu = Math.log(meanManwon) - (sigma * sigma) / 2;
  return Math.exp(mu + sigma * inverseNormalCdf(1 - topPercent / 100));
}

export type KrIncomeComparisonRow = {
  level: KrRegionLevel;
  name: string;
  mean: number;
  ratioPercent: number;
  estimatedTopPercent: number; // display-clamped 1-99, see clampDisplayPercent
  estimateNote: string | null; // non-null when `mean` is an estimate (see getEstimateNote)
};

function toRow(level: KrRegionLevel, region: KrRegionIncome, annualIncomeManwon: number): KrIncomeComparisonRow {
  return {
    level,
    name: region.name,
    mean: region.mean,
    estimateNote: getEstimateNote(region),
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
