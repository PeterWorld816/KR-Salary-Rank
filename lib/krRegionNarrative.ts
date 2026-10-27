// Builds the data-driven write-up shown on each /[region] page. Every number
// comes from data/kr/regionIncome.json (plus lib/krTakeHome.ts for the
// take-home example); sentences are picked by comparing those numbers, so
// 17 pages read differently because their data differs — no hand-written
// per-region claims, and nothing about causes the data can't show.
import { KR_SIDO } from "@/data/kr/regionMeta";
import { getAvailableGusForSido, getNationalIncome, getRegionIncomeByName, type KrRegionIncome } from "@/lib/krIncomeCalc";
import { estimateKrTakeHome } from "@/lib/krTakeHome";

export type KrRegionTableRow = {
  rank: number | null; // null for estimates (not ranked against real values)
  name: string;
  mean: number;
  vsNationalPercent: number;
  isCityWide: boolean;
  isEstimate: boolean;
};

export type KrRegionNarrative = {
  paragraphs: string[];
  rows: KrRegionTableRow[];
  year: number;
};

const won = (manwon: number) => `${manwon.toLocaleString("ko-KR")}만원`;
const pct = (value: number) => `${Math.abs(value).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
const METRO_SLUGS = new Set(["seoul", "busan", "daegu", "incheon", "gwangju", "daejeon", "ulsan", "sejong"]);

// Korean particle helpers: 은/는, 이/가, 과/와 by final consonant.
function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}
const eunNeun = (w: string) => `${w}${hasBatchim(w) ? "은" : "는"}`;
const gwaWa = (w: string) => `${w}${hasBatchim(w) ? "과" : "와"}`;

type SidoStat = { slug: string; name: string; mean: number; realGus: KrRegionIncome[]; estimateCount: number };

function sidoStats(): SidoStat[] {
  return KR_SIDO.filter((s) => s.available).map((s) => {
    const gus = getAvailableGusForSido(s.slug).map((g) => g.income);
    return {
      slug: s.slug,
      name: s.name,
      mean: getRegionIncomeByName(s.name)!.mean,
      realGus: gus.filter((g) => !g.isEstimate && g.slug !== "sejong-city"),
      estimateCount: gus.filter((g) => g.isEstimate).length,
    };
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function buildKrRegionNarrative(sidoSlug: string): KrRegionNarrative | null {
  const all = sidoStats();
  const me = all.find((s) => s.slug === sidoSlug);
  if (!me) return null;
  const national = getNationalIncome();
  const N = national.mean;
  const year = national.year;

  const ranked = [...all].sort((a, b) => b.mean - a.mean);
  const rank = ranked.findIndex((s) => s.slug === me.slug) + 1;
  const total = ranked.length;
  const above = ranked[rank - 2];
  const below = ranked[rank];
  const diff = me.mean - N;
  const diffPct = (diff / N) * 100;
  const isMetro = METRO_SLUGS.has(me.slug);
  const peers = ranked.filter((s) => METRO_SLUGS.has(s.slug) === isMetro);
  const peerRank = peers.findIndex((s) => s.slug === me.slug) + 1;
  const subject = eunNeun(me.name);

  // ── 1. 시·도 전체 ────────────────────────────────────────────────────────
  const p1: string[] = [];
  if (rank === 1) p1.push(`${year}년 귀속 근로소득 연말정산 신고 기준으로 ${me.name}의 1인당 평균 총급여는 ${won(me.mean)}으로, 전국 ${total}개 시·도 가운데 가장 높습니다.`);
  else if (rank === total) p1.push(`${year}년 귀속 근로소득 연말정산 신고 기준으로 ${me.name}의 1인당 평균 총급여는 ${won(me.mean)}으로, 전국 ${total}개 시·도 가운데 가장 낮습니다.`);
  else if (rank <= 4) p1.push(`${subject} ${year}년 귀속 1인당 평균 총급여가 ${won(me.mean)}으로 ${total}개 시·도 중 ${rank}위, 상위권에 속합니다.`);
  else if (rank >= total - 3) p1.push(`${subject} ${year}년 귀속 1인당 평균 총급여 ${won(me.mean)}으로 ${total}개 시·도 중 ${rank}위입니다. 순위로는 하위권에 해당합니다.`);
  else p1.push(`${me.name}의 ${year}년 귀속 1인당 평균 총급여는 ${won(me.mean)}입니다. ${total}개 시·도 중 ${rank}위로, 전체 순위의 중간 지대에 있습니다.`);

  if (Math.abs(diffPct) < 3) p1.push(`전국 평균 ${won(N)}과의 차이는 ${won(Math.abs(diff))}(${pct(diffPct)})에 불과해, 사실상 전국 평균과 비슷한 수준이라고 볼 수 있습니다.`);
  else if (diff > 0) p1.push(`전국 평균 ${won(N)}보다 ${won(diff)}, 비율로는 ${pct(diffPct)} 높습니다.`);
  else p1.push(`전국 평균 ${won(N)}에 비해 ${won(-diff)}, 비율로는 ${pct(diffPct)} 낮은 수준입니다.`);

  const neighbor: string[] = [];
  if (above) neighbor.push(`한 계단 위인 ${above.name}(${won(above.mean)})과는 ${won(above.mean - me.mean)}`);
  if (below) neighbor.push(`바로 아래 ${below.name}(${won(below.mean)})과는 ${won(me.mean - below.mean)}`);
  if (neighbor.length) p1.push(`순위가 인접한 지역과 비교하면 ${neighbor.join(", ")} 차이가 납니다.`);
  const peerGroup = isMetro ? `특별시·광역시·특별자치시 ${peers.length}곳` : `도 단위 ${peers.length}곳`;
  if (peerRank === 1) p1.push(`${peerGroup}만 놓고 봐도 가장 높습니다.`);
  else if (peerRank === peers.length) p1.push(`${peerGroup}만 놓고 봐도 가장 낮습니다.`);
  else p1.push(`${peerGroup}만 놓고 보면 ${peerRank}번째로 높습니다.`);

  // ── 2. 시군구 분포 ───────────────────────────────────────────────────────
  const p2: string[] = [];
  const gus = [...me.realGus].sort((a, b) => b.mean - a.mean);
  if (gus.length >= 2) {
    const top = gus[0];
    const bottom = gus[gus.length - 1];
    const gap = top.mean - bottom.mean;
    const gapRatio = top.mean / bottom.mean;
    const spreads = all
      .filter((s) => s.realGus.length >= 2)
      .map((s) => ({ slug: s.slug, gap: Math.max(...s.realGus.map((g) => g.mean)) - Math.min(...s.realGus.map((g) => g.mean)) }))
      .sort((a, b) => b.gap - a.gap);
    const gapRank = spreads.findIndex((s) => s.slug === me.slug) + 1;
    const overNational = gus.filter((g) => g.mean > N).length;
    const overSido = gus.filter((g) => g.mean > me.mean).length;
    const cityWide = gus.filter((g) => g.aggregation === "city").length;

    p2.push(`${me.name} 안에서 공식 통계가 있는 시군구는 ${gus.length}곳입니다${cityWide ? `(이 중 ${cityWide}곳은 구별이 아닌 시 전체 값)` : ""}.`);
    p2.push(`평균이 가장 높은 곳은 ${top.name}(${won(top.mean)}), 가장 낮은 곳은 ${bottom.name}(${won(bottom.mean)})으로 두 지역의 차이는 ${won(gap)}, 높은 쪽이 낮은 쪽의 ${gapRatio.toFixed(2)}배입니다.`);
    if (gapRank === 1) p2.push(`시군구 간 최고·최저 격차는 시군구가 둘 이상인 시·도 가운데 가장 큽니다.`);
    else if (gapRank <= 4) p2.push(`이 격차는 시군구가 둘 이상인 ${spreads.length}개 시·도 중 ${gapRank}번째로 커서, 지역 안의 편차가 큰 편입니다.`);
    else if (gapRank >= spreads.length - 3) p2.push(`이 격차는 ${spreads.length}개 시·도 중 ${gapRank}번째로, 다른 시·도에 비해 시군구끼리 평균이 고른 편입니다.`);
    else p2.push(`격차의 크기는 ${spreads.length}개 시·도 중 ${gapRank}번째로 중간 정도입니다.`);

    if (overNational === gus.length) p2.push(`모든 시군구의 평균이 전국 평균(${won(N)})을 넘습니다.`);
    else if (overNational === 0) p2.push(`전국 평균(${won(N)})을 넘는 시군구는 한 곳도 없습니다.`);
    else if (overNational * 2 > gus.length) p2.push(`${gus.length}곳 중 ${overNational}곳이 전국 평균(${won(N)})보다 높아, 전국 평균을 웃도는 곳이 더 많습니다.`);
    else p2.push(`전국 평균(${won(N)})을 넘는 곳은 ${gus.length}곳 중 ${overNational}곳으로 소수입니다.`);
    p2.push(`${me.name} 전체 평균보다 높은 시군구는 ${overSido}곳, 낮은 곳은 ${gus.length - overSido}곳입니다.`);
  } else {
    p2.push(`${subject} 하위 시군구로 나뉘지 않은 단일 행정구역이라, 시군구별 비교 대신 시 전체 평균 ${won(me.mean)} 하나로 표시합니다.`);
    p2.push(`그래서 이 지역 안에서의 최고·최저나 격차는 공식 통계로 계산할 수 없고, 다른 시·도나 전국 평균과의 비교가 주요한 해석 방법입니다.`);
    p2.push(`전국 ${total}개 시·도 순위에서 ${rank}위라는 점, 그리고 전국 평균과 ${won(Math.abs(diff))} 차이가 난다는 점이 이 지역 숫자의 핵심입니다.`);
  }

  // ── 3. 해석과 활용 ───────────────────────────────────────────────────────
  const p3: string[] = [];
  if (gus.length >= 3) {
    const m = median(gus.map((g) => g.mean));
    const near = gus.filter((g) => Math.abs(g.mean - me.mean) / me.mean <= 0.05).length;
    if (me.mean - m > 50) p3.push(`시군구 평균값들을 한 줄로 세웠을 때 가운데 값은 ${won(m)}으로 ${me.name} 평균(${won(me.mean)})보다 낮습니다. 시·도 평균은 근로자 수로 가중된 값이라, 근로자가 많은 고소득 시군구의 영향이 더 크게 반영된 결과로 읽을 수 있습니다.`);
    else if (m - me.mean > 50) p3.push(`시군구 평균값들의 가운데 값은 ${won(m)}으로 오히려 ${me.name} 평균(${won(me.mean)})보다 높습니다. 근로자가 많은 시군구의 평균이 상대적으로 낮아 시·도 전체 평균을 끌어내린 모양입니다.`);
    else p3.push(`시군구 평균값들의 가운데 값(${won(m)})과 ${me.name} 평균(${won(me.mean)})이 거의 같아, 특정 지역에 쏠리지 않은 분포에 가깝습니다.`);
    p3.push(`시·도 평균의 ±5% 범위 안에 드는 시군구는 ${gus.length}곳 중 ${near}곳입니다.`);
  }
  if (me.estimateCount > 0) p3.push(`지도에서 ${me.estimateCount}개 일반구는 구별 공식 통계가 없어 소속 시 전체 평균을 그대로 넣은 추정치이며, 표에서 ‘추정’으로 표시했습니다.`);
  const takeHome = estimateKrTakeHome(me.mean);
  p3.push(`참고로 ${me.name} 평균인 연 ${won(me.mean)}을 받는 1인 가구라면, 이 사이트의 간이 계산으로 세후 월 실수령액이 약 ${won(Math.round(takeHome.net / 10_000))} 정도로 추정됩니다(2026년 4대보험 요율과 소득세 기준).`);
  p3.push(`평균은 주소지 기준 근로소득 연말정산 신고자만 집계한 값이어서 사업소득이나 가구소득과는 다르고, 고소득자 몇 명이 평균을 끌어올릴 수 있다는 점도 함께 고려해야 합니다. 위 지도에서 시군구를 선택하거나 내 연봉을 입력하면 ${gwaWa(me.name)} 시군구 평균 대비 위치를 바로 확인할 수 있습니다.`);

  // ── 표 ───────────────────────────────────────────────────────────────────
  const estimates = getAvailableGusForSido(me.slug).map((g) => g.income).filter((g) => g.isEstimate).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const rows: KrRegionTableRow[] = [
    ...gus.map((g, i) => ({ rank: i + 1, name: g.name, mean: g.mean, vsNationalPercent: Math.round((g.mean / N) * 1000) / 10, isCityWide: g.aggregation === "city", isEstimate: false })),
    ...estimates.map((g) => ({ rank: null, name: g.name, mean: g.mean, vsNationalPercent: Math.round((g.mean / N) * 1000) / 10, isCityWide: false, isEstimate: true })),
  ];

  return { paragraphs: [p1.join(" "), p2.join(" "), p3.join(" ")], rows, year };
}

