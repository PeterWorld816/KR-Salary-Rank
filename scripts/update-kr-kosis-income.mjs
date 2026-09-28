import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const incomePath = path.join(root, "data/kr/regionIncome.json");
const metaPath = path.join(root, "data/kr/regionMeta.ts");
const topologyPath = path.join(root, "data/kr/skorea-municipalities-2018-topo-simple.json");
const regionIncome = JSON.parse(fs.readFileSync(incomePath, "utf8"));
const metaSource = fs.readFileSync(metaPath, "utf8");
const topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
const features = Object.values(topology.objects)[0].geometries.map((geometry) => ({
  code: String(geometry.properties.code),
  name: geometry.properties.name,
}));

const sidoRows = [...metaSource.matchAll(
  /\{ code: "(\d+)", slug: "([^"]+)", name: "([^"]+)", available: (?:true|false) \}/g
)].map(([, code, slug, name]) => ({ code, slug, name }));
const sidoShortName = (name) => name
  .replace(/^충청북도$/, "충북")
  .replace(/^충청남도$/, "충남")
  .replace(/^전라남도$/, "전남")
  .replace(/^경상북도$/, "경북")
  .replace(/^경상남도$/, "경남")
  .slice(0, 2);
const sidoByShortName = new Map(sidoRows.map((sido) => [sidoShortName(sido.name), sido]));

const knownGuRows = [...metaSource.matchAll(
  /\{ slug: "([^"]+)", name: "([^"]+)", parentSlug: "([^"]+)", available: (?:true|false), code: "(\d+)" \}/g
)].map(([, slug, name, parentSlug, code]) => ({ slug, name, parentSlug, code }));
for (const row of regionIncome.regions.filter((region) => region.level === "gu" && region.slug && region.parentSlug)) {
  if (row.code && !knownGuRows.some((known) => known.code === row.code)) {
    knownGuRows.push({ slug: row.slug, name: row.name, parentSlug: row.parentSlug, code: row.code });
  }
}

const normalize = (value) => value.normalize("NFC").replace(/\s/g, "");
const shortNames = (name) => {
  const parenthetical = [...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  return [name.replace(/\([^)]*\)/g, ""), ...parenthetical].map(normalize);
};
const commonPrefix = (values) => {
  if (!values.length) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    let index = 0;
    while (index < prefix.length && prefix[index] === value[index]) index += 1;
    prefix = prefix.slice(0, index);
  }
  return prefix;
};
const readTable = (filename) => fs.readFileSync(path.join(root, filename), "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split("|"));

const summaryRows = readTable("data/kr/kosis-income-summary-2023.tsv");
const detailedRows = readTable("data/kr/kosis-sgg-income-2023.tsv");
if (summaryRows.length !== 18 || detailedRows.length !== 228) {
  throw new Error(`Unexpected KOSIS snapshot size: ${summaryRows.length} summary rows, ${detailedRows.length} detailed rows`);
}
// These are the existing TASIS 2024 rows; all other regions use the official
// KOSIS 2023 snapshot below until comparable newer data is verified.
const retained2024Codes = new Set([
  "22060", "22070", "22310",
  "37020", "37030", "37040", "37050", "37060", "37070", "37080", "37090", "37100",
  "37320", "37330", "37340", "37350", "37370", "37380", "37390", "37400", "37410",
  "37420", "37430",
]);
const oldRegions = regionIncome.regions;
const oldByCode = new Map();
for (const row of oldRegions.filter((region) => region.level === "gu")) {
  const metadata = knownGuRows.find((known) =>
    known.name === row.name &&
    known.parentSlug === sidoRows.find((sido) => sido.name === row.parent)?.slug
  );
  if (metadata) oldByCode.set(metadata.code, row);
}

const updatedSummary = summaryRows.map(([shortName, workerCount, totalPayMillionWon]) => {
  const count = Number(workerCount);
  const total = Number(totalPayMillionWon);
  const sido = shortName === "전국" ? null : sidoByShortName.get(shortName);
  if (shortName !== "전국" && !sido) throw new Error(`Unknown KOSIS summary region: ${shortName}`);
  return {
    name: sido?.name ?? "전국",
    level: sido ? "sido" : "national",
    mean: Math.round((total / count) * 100),
    sourceYear: 2023,
  };
});

const updatedDetails = detailedRows.map(([shortParent, rawName, workerCount, totalPayMillionWon]) => {
  const sido = sidoByShortName.get(shortParent);
  if (!sido) throw new Error(`Unknown KOSIS detail parent: ${shortParent}`);
  const count = Number(workerCount);
  const total = Number(totalPayMillionWon);
  const candidates = shortNames(rawName);
  let matches = features.filter((feature) =>
    feature.code.startsWith(sido.code) && candidates.includes(normalize(feature.name))
  );
  if (matches.length === 0) {
    matches = features.filter((feature) => candidates.includes(normalize(feature.name)));
  }

  let code;
  let aggregation;
  if (matches.length === 1) {
    code = matches[0].code;
  } else if (matches.length === 0) {
    const aggregateName = normalize(rawName.replace(/\([^)]*\)/g, ""));
    const children = features.filter((feature) =>
      feature.code.startsWith(sido.code) && normalize(feature.name).startsWith(aggregateName)
    );
    const prefix = commonPrefix(children.map((feature) => feature.code));
    if (children.length < 2 || prefix.length < 3) {
      throw new Error(`Cannot map KOSIS region to the 2018 map: ${shortParent}|${rawName}`);
    }
    aggregation = "city";
    code = undefined;
    const existingAggregate = oldRegions.find((region) =>
      region.level === "gu" &&
      region.parent === sido.name &&
      candidates.includes(normalize(region.name))
    );
    const slug = existingAggregate?.slug ?? `${sido.slug}-${prefix}-city`;
    return {
      name: existingAggregate?.name ?? rawName.replace(/\([^)]*\)/g, "").trim(),
      level: "gu",
      parent: sido.name,
      parentSlug: sido.slug,
      slug,
      aggregation,
      mean: Math.round((total / count) * 100),
      sourceYear: 2023,
    };
  } else {
    throw new Error(`Ambiguous KOSIS-to-map match: ${shortParent}|${rawName}`);
  }

  const existingMeta = knownGuRows.find((known) => known.code === code);
  const existingRegion = oldByCode.get(code);
  const keep2024 = !!existingRegion && retained2024Codes.has(code);
  const regionName = existingMeta?.name ?? rawName.replace(/\([^)]*\)/g, "").trim();
  return {
    name: regionName,
    level: "gu",
    parent: sido.name,
    parentSlug: sido.slug,
    slug: existingMeta?.slug ?? `${sido.slug}-${code}`,
    code,
    mean: keep2024 ? existingRegion.mean : Math.round((total / count) * 100),
    sourceYear: keep2024 ? 2024 : 2023,
  };
});

const sejongSido = sidoRows.find((sido) => sido.slug === "sejong");
const sejongMean = updatedSummary.find((region) => region.level === "sido" && region.name === sejongSido?.name);
const sejongFeature = features.find((feature) => feature.code === "29010");
if (!sejongSido || !sejongMean || !sejongFeature) {
  throw new Error("Cannot map Sejong's province-level average to its single-city boundary");
}
updatedDetails.push({
  name: sejongFeature.name,
  level: "gu",
  parent: sejongSido.name,
  parentSlug: sejongSido.slug,
  slug: "sejong-city",
  code: sejongFeature.code,
  aggregation: "city",
  mean: sejongMean.mean,
  sourceYear: 2023,
});

const currentSidoOrder = oldRegions.filter((region) => region.level === "sido").map((region) => region.name);
updatedSummary.sort((a, b) => {
  if (a.level === "national") return -1;
  if (b.level === "national") return 1;
  return currentSidoOrder.indexOf(a.name) - currentSidoOrder.indexOf(b.name);
});
updatedDetails.sort((a, b) =>
  a.parent.localeCompare(b.parent, "ko") || a.name.localeCompare(b.name, "ko")
);

const detailSlugs = updatedDetails.map((region) => region.slug);
if (new Set(detailSlugs).size !== detailSlugs.length) {
  throw new Error("KOSIS detail rows produced duplicate region slugs");
}
const detailCodes = updatedDetails.flatMap((region) => region.code ? [region.code] : []);
if (new Set(detailCodes).size !== detailCodes.length) {
  throw new Error("KOSIS detail rows produced duplicate map codes");
}

const latest2024Count = updatedDetails.filter((region) => region.sourceYear === 2024).length;
regionIncome.meta = {
  ...regionIncome.meta,
  source: `KOSIS 국세통계 4.2.15 시군구별 근로소득 연말정산 신고현황(주소지), tblId DT_133001N_4215, orgId 133 (2023년 귀속; 근로자 수와 급여총계 금액으로 평균 계산)${latest2024Count ? ` + 대구 3개 구·경북 20개 시군은 TASIS 2024년 귀속 자료를 인용한 경북일보 기사(https://www.kyongbuk.co.kr/news/articleView.html?idxno=4080807) 기준 ${latest2024Count}건 유지` : ""}. 원자료 스냅샷: data/kr/kosis-income-summary-2023.tsv, data/kr/kosis-sgg-income-2023.tsv.`,
  asOf: `전국·17개 시/도 및 구/시/군별 자료는 KOSIS 2023년 귀속(자료갱신일 2026-02-20)${latest2024Count ? `; 대구·경북 ${latest2024Count}개 기존 구/군 수치만 2024년 귀속` : ""}.`,
  note: "KOSIS 주소지 기준 급여총계 금액(백만원)을 급여총계 인원(명)으로 나눈 뒤 만원 단위로 반올림했다. 공식 표에서 시 전체로만 제공하는 지역(고양·성남·수원·안산·안양·용인·청주·천안·전주·포항·창원)은 시 전체 평균으로만 제공하며, 이를 구별 지도 경계에 복제하지 않는다. 세종은 하위 구분 없이 단일 시 경계만 있어 시/도 총계를 해당 단일 경계에도 같은 시 전체 평균으로 표시한다. 읍·면·동 단위 근로소득 평균은 이 표에 공개되어 있지 않아 제공하지 않는다.",
  generatedAt: new Date().toISOString().slice(0, 10),
};
regionIncome.regions = [...updatedSummary, ...updatedDetails];
fs.writeFileSync(incomePath, `${JSON.stringify(regionIncome, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  summaryRows: updatedSummary.length,
  kosisDetailRows: detailedRows.length,
  availableRegionRows: updatedDetails.length,
  mapMatched: updatedDetails.filter((region) => region.code).length,
  cityAggregates: updatedDetails.filter((region) => region.aggregation === "city").map((region) => region.name),
  retained2024Rows: latest2024Count,
}, null, 2));
