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
  // 5-digit 시군구 code, first 2 digits = parent SidoMeta.code — matches the
  // 시군구 topojson's feature.properties.code (data/kr/skorea-municipalities-2018-topo-simple.json,
  // same southkorea/southkorea-maps source as the province topology), so
  // KrMap can join a clicked gu polygon back to a slug the same way it joins
  // sido polygons by SidoMeta.code. The gu topojson's own feature name has no
  // sido prefix (e.g. plain "동구"), so this code — not the name — is the key.
  code: string;
};

export const KR_GU: GuMeta[] = [
  { slug: "seoul-gangnam", name: "강남구", parentSlug: "seoul", available: true, code: "11230" },
  { slug: "seoul-seocho", name: "서초구", parentSlug: "seoul", available: true, code: "11220" },
  { slug: "seoul-yongsan", name: "용산구", parentSlug: "seoul", available: true, code: "11030" },
  { slug: "seoul-songpa", name: "송파구", parentSlug: "seoul", available: true, code: "11240" },
  { slug: "seoul-jongno", name: "종로구", parentSlug: "seoul", available: true, code: "11010" },
  { slug: "seoul-seongdong", name: "성동구", parentSlug: "seoul", available: true, code: "11040" },
  { slug: "seoul-mapo", name: "마포구", parentSlug: "seoul", available: true, code: "11140" },
  { slug: "seoul-yangcheon", name: "양천구", parentSlug: "seoul", available: true, code: "11150" },
  { slug: "seoul-yeongdeungpo", name: "영등포구", parentSlug: "seoul", available: true, code: "11190" },
  { slug: "seoul-seodaemun", name: "서대문구", parentSlug: "seoul", available: true, code: "11130" },
  { slug: "seoul-dongjak", name: "동작구", parentSlug: "seoul", available: true, code: "11200" },
  { slug: "seoul-gangdong", name: "강동구", parentSlug: "seoul", available: true, code: "11250" },
  { slug: "seoul-seongbuk", name: "성북구", parentSlug: "seoul", available: true, code: "11080" },
  { slug: "seoul-gwangjin", name: "광진구", parentSlug: "seoul", available: true, code: "11050" },
  { slug: "seoul-gangseo", name: "강서구", parentSlug: "seoul", available: true, code: "11160" },
  { slug: "seoul-nowon", name: "노원구", parentSlug: "seoul", available: true, code: "11110" },
  { slug: "seoul-dongdaemun", name: "동대문구", parentSlug: "seoul", available: true, code: "11060" },
  { slug: "seoul-eunpyeong", name: "은평구", parentSlug: "seoul", available: true, code: "11120" },
  { slug: "seoul-guro", name: "구로구", parentSlug: "seoul", available: true, code: "11170" },
  { slug: "seoul-gwanak", name: "관악구", parentSlug: "seoul", available: true, code: "11210" },
  { slug: "seoul-dobong", name: "도봉구", parentSlug: "seoul", available: true, code: "11100" },
  { slug: "seoul-geumcheon", name: "금천구", parentSlug: "seoul", available: true, code: "11180" },
  { slug: "seoul-gangbuk", name: "강북구", parentSlug: "seoul", available: true, code: "11090" },
  { slug: "seoul-junggu", name: "중구", parentSlug: "seoul", available: false, code: "11020" },
  { slug: "seoul-jungnang", name: "중랑구", parentSlug: "seoul", available: false, code: "11070" },
  { slug: "incheon-donggu", name: "인천 동구", parentSlug: "incheon", available: true, code: "23020" },
  { slug: "ulsan-bukgu", name: "울산 북구", parentSlug: "ulsan", available: true, code: "26040" },
  { slug: "gyeonggi-icheon", name: "경기 이천시", parentSlug: "gyeonggi", available: true, code: "31210" },
];

const guBySlug = new Map(KR_GU.map((g) => [g.slug, g]));

export function getGuBySlug(slug: string): GuMeta | null {
  return guBySlug.get(slug.toLowerCase()) ?? null;
}

export function getGusForSidoSlug(sidoSlug: string): GuMeta[] {
  return KR_GU.filter((g) => g.parentSlug === sidoSlug);
}
