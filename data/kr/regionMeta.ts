// Static reference data for /kr — routing slugs and KOSIS/SGIS 2-digit
// province codes for the 17 시도, plus which ones actually have a row in
// data/kr/regionIncome.json. This is fixed administrative reference data
// (not a statistic that changes), safe to hardcode unlike the income figures
// themselves. Mirrors data/us/stateMeta.ts's fips/abbr/name split.
//
// `code` matches the `code` property on each feature in
// data/kr/skorea-provinces-2018-topo-simple.json (source: southkorea/southkorea-maps,
// KOGL Type 1 license), so KrMap can join a clicked polygon back to a slug
// without re-deriving it from the Korean name string.
import regionIncomeData from "@/data/kr/regionIncome.json";

export type SidoMeta = {
  code: string; // 2-digit KOSIS province code, matches the province topojson's feature.properties.code
  slug: string; // lowercase route slug, e.g. "seoul"
  name: string; // official Korean name, matches data/kr/regionIncome.json's `name`
  available: boolean; // has a real row in regionIncome.json (false = "준비중")
};

export const KR_SIDO: SidoMeta[] = [
  { code: "11", slug: "seoul", name: "서울특별시", available: true },
  { code: "21", slug: "busan", name: "부산광역시", available: true },
  { code: "22", slug: "daegu", name: "대구광역시", available: true },
  { code: "23", slug: "incheon", name: "인천광역시", available: true },
  { code: "24", slug: "gwangju", name: "광주광역시", available: true },
  { code: "25", slug: "daejeon", name: "대전광역시", available: true },
  { code: "26", slug: "ulsan", name: "울산광역시", available: true },
  { code: "29", slug: "sejong", name: "세종특별자치시", available: true },
  { code: "31", slug: "gyeonggi", name: "경기도", available: true },
  { code: "32", slug: "gangwon", name: "강원특별자치도", available: true },
  { code: "33", slug: "chungbuk", name: "충청북도", available: true },
  { code: "34", slug: "chungnam", name: "충청남도", available: true },
  { code: "35", slug: "jeonbuk", name: "전북특별자치도", available: true },
  { code: "36", slug: "jeonnam", name: "전라남도", available: true },
  { code: "37", slug: "gyeongbuk", name: "경상북도", available: true },
  { code: "38", slug: "gyeongnam", name: "경상남도", available: true },
  { code: "39", slug: "jeju", name: "제주특별자치도", available: true },
];

const sidoByCode = new Map(KR_SIDO.map((s) => [s.code, s]));
const sidoBySlug = new Map(KR_SIDO.map((s) => [s.slug, s]));
const sidoByName = new Map(KR_SIDO.map((s) => [s.name, s]));

export function getSidoByCode(code: string): SidoMeta | null {
  return sidoByCode.get(code) ?? null;
}

export function getSidoBySlug(slug: string): SidoMeta | null {
  return sidoBySlug.get(slug.toLowerCase()) ?? null;
}

export function getSidoByName(name: string): SidoMeta | null {
  return sidoByName.get(name) ?? null;
}

// 시군구(구) level — only the handful of 시/도 with at least one real row in
// regionIncome.json get an entry here. `available: false` rows are known,
// named places we deliberately have no figure for yet (see regionIncome.json's
// meta.note) — kept here only so the UI can list them as "준비중" instead of
// silently pretending they don't exist.
export type GuMeta = {
  slug: string;
  name: string; // matches data/kr/regionIncome.json's `name` when available
  parentSlug: string; // SidoMeta.slug
  available: boolean;
  // Matches the municipality topology's feature.properties.code. Older
  // boundaries can use a code from a previous parent province (e.g. Gunwi);
  // the parentSlug here is the current statistical assignment. City-wide
  // statistics have no single polygon code and are selected from the list.
  code?: string;
  aggregation?: "city";
};

type IncomeRegionMetaRow = {
  name: string;
  level: string;
  parentSlug?: string;
  slug?: string;
  code?: string;
  aggregation?: "city";
};

const incomeGuRows = (regionIncomeData.regions as IncomeRegionMetaRow[]).filter((row) => row.level === "gu");
const availableGus: GuMeta[] = incomeGuRows.map((row) => {
  if (!row.slug || !row.parentSlug) {
    throw new Error(`Missing route metadata for income region: ${row.name}`);
  }
  return {
    slug: row.slug,
    name: row.name,
    parentSlug: row.parentSlug,
    available: true,
    ...(row.code ? { code: row.code } : {}),
    ...(row.aggregation ? { aggregation: row.aggregation } : {}),
  };
});

const pendingGus: GuMeta[] = [
  { slug: "gyeongbuk-pohang-nam", name: "포항시남구", parentSlug: "gyeongbuk", available: false, code: "37011" },
  { slug: "gyeongbuk-pohang-buk", name: "포항시북구", parentSlug: "gyeongbuk", available: false, code: "37012" },
];

export const KR_GU: GuMeta[] = [...availableGus, ...pendingGus];

const guBySlug = new Map(KR_GU.map((g) => [g.slug, g]));

export function getGuBySlug(slug: string): GuMeta | null {
  return guBySlug.get(slug.toLowerCase()) ?? null;
}

export function getGusForSidoSlug(sidoSlug: string): GuMeta[] {
  return KR_GU.filter((g) => g.parentSlug === sidoSlug);
}
