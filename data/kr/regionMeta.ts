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

export type SidoMeta = {
  code: string; // 2-digit KOSIS province code, matches the province topojson's feature.properties.code
  slug: string; // lowercase route slug, e.g. "seoul"
  name: string; // official Korean name, matches data/kr/regionIncome.json's `name`
  available: boolean; // has a real row in regionIncome.json (false = "준비중")
};

export const KR_SIDO: SidoMeta[] = [
  { code: "11", slug: "seoul", name: "서울특별시", available: true },
  { code: "21", slug: "busan", name: "부산광역시", available: false },
  { code: "22", slug: "daegu", name: "대구광역시", available: false },
  { code: "23", slug: "incheon", name: "인천광역시", available: true },
  { code: "24", slug: "gwangju", name: "광주광역시", available: false },
  { code: "25", slug: "daejeon", name: "대전광역시", available: true },
  { code: "26", slug: "ulsan", name: "울산광역시", available: true },
  { code: "29", slug: "sejong", name: "세종특별자치시", available: true },
  { code: "31", slug: "gyeonggi", name: "경기도", available: true },
  { code: "32", slug: "gangwon", name: "강원특별자치도", available: false },
  { code: "33", slug: "chungbuk", name: "충청북도", available: true },
  { code: "34", slug: "chungnam", name: "충청남도", available: true },
  { code: "35", slug: "jeonbuk", name: "전북특별자치도", available: false },
  { code: "36", slug: "jeonnam", name: "전라남도", available: true },
  { code: "37", slug: "gyeongbuk", name: "경상북도", available: true },
  { code: "38", slug: "gyeongnam", name: "경상남도", available: true },
  { code: "39", slug: "jeju", name: "제주특별자치도", available: false },
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
};

export const KR_GU: GuMeta[] = [
  { slug: "seoul-gangnam", name: "강남구", parentSlug: "seoul", available: true },
  { slug: "seoul-seocho", name: "서초구", parentSlug: "seoul", available: true },
  { slug: "seoul-yongsan", name: "용산구", parentSlug: "seoul", available: true },
  { slug: "seoul-songpa", name: "송파구", parentSlug: "seoul", available: true },
  { slug: "seoul-jongno", name: "종로구", parentSlug: "seoul", available: true },
  { slug: "seoul-seongdong", name: "성동구", parentSlug: "seoul", available: true },
  { slug: "seoul-mapo", name: "마포구", parentSlug: "seoul", available: true },
  { slug: "seoul-yangcheon", name: "양천구", parentSlug: "seoul", available: true },
  { slug: "seoul-yeongdeungpo", name: "영등포구", parentSlug: "seoul", available: true },
  { slug: "seoul-seodaemun", name: "서대문구", parentSlug: "seoul", available: true },
  { slug: "seoul-dongjak", name: "동작구", parentSlug: "seoul", available: true },
  { slug: "seoul-gangdong", name: "강동구", parentSlug: "seoul", available: true },
  { slug: "seoul-seongbuk", name: "성북구", parentSlug: "seoul", available: true },
  { slug: "seoul-gwangjin", name: "광진구", parentSlug: "seoul", available: true },
  { slug: "seoul-gangseo", name: "강서구", parentSlug: "seoul", available: true },
  { slug: "seoul-nowon", name: "노원구", parentSlug: "seoul", available: true },
  { slug: "seoul-dongdaemun", name: "동대문구", parentSlug: "seoul", available: true },
  { slug: "seoul-eunpyeong", name: "은평구", parentSlug: "seoul", available: true },
  { slug: "seoul-guro", name: "구로구", parentSlug: "seoul", available: true },
  { slug: "seoul-gwanak", name: "관악구", parentSlug: "seoul", available: true },
  { slug: "seoul-dobong", name: "도봉구", parentSlug: "seoul", available: true },
  { slug: "seoul-geumcheon", name: "금천구", parentSlug: "seoul", available: true },
  { slug: "seoul-gangbuk", name: "강북구", parentSlug: "seoul", available: true },
  { slug: "seoul-junggu", name: "중구", parentSlug: "seoul", available: false },
  { slug: "seoul-jungnang", name: "중랑구", parentSlug: "seoul", available: false },
  { slug: "incheon-donggu", name: "인천 동구", parentSlug: "incheon", available: true },
  { slug: "ulsan-bukgu", name: "울산 북구", parentSlug: "ulsan", available: true },
  { slug: "gyeonggi-icheon", name: "경기 이천시", parentSlug: "gyeonggi", available: true },
];

const guBySlug = new Map(KR_GU.map((g) => [g.slug, g]));

export function getGuBySlug(slug: string): GuMeta | null {
  return guBySlug.get(slug.toLowerCase()) ?? null;
}

export function getGusForSidoSlug(sidoSlug: string): GuMeta[] {
  return KR_GU.filter((g) => g.parentSlug === sidoSlug);
}
