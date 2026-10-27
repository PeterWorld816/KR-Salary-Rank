// Builds data/kr/regionIncome.json from raw 국세청 국세통계 tables.
//
//   node scripts/build-region-data.mjs
//
// Input (first match wins):
//   1. data/raw/kosis-sgg-income-<YEAR>.csv — the newest year found. Either a
//      KOSIS "CSV 다운로드" of DT_133001N_4215 (see data/raw/README.md), or a
//      normalized table with columns parent,name,workerCount,totalPayMillionWon
//      (parent "전국" / name "" rows for the summary, `|`, tab or comma separated).
//   2. The checked-in 2023 snapshots, data/kr/kosis-income-summary-2023.tsv +
//      data/kr/kosis-sgg-income-2023.tsv.
//
// Output rows carry `source`, `year` and `isEstimate`. Every 시/도 and every
// 시군구 polygon on the 2018 municipality map ends up with a value:
//   - Real (isEstimate: false): KOSIS rows, matched to a map polygon by name.
//     11 cities (고양·성남·수원·안산·안양·용인·청주·천안·전주·포항·창원) are
//     published only city-wide; they stay as one `aggregation: "city"` row.
//     세종 has a single boundary and takes the 시/도 total.
//   - Estimate (isEstimate: true): any map polygon still without a value.
//     A 일반구 inside one of those cities gets the city-wide mean as-is
//     (estimateMethod "city-mean") — it's the smallest published unit that
//     contains it, and we have nothing to shift it up or down by. Anything
//     else would fall back to its 시/도 mean ("sido-mean"); the script logs
//     how many of each it made. Explained to visitors in
//     app/insights/articles.ts ("how-income-percentile-estimate-works").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const incomePath = path.join(root, "data/kr/regionIncome.json");
const metaPath = path.join(root, "data/kr/regionMeta.ts");
const topologyPath = path.join(root, "data/kr/skorea-municipalities-2018-topo-simple.json");
const rawDir = path.join(root, "data/raw");

const SOURCE_NAME = "국세청 국세통계 근로소득 연말정산 신고현황(주소지), KOSIS DT_133001N_4215";
const SOURCE_URL = "https://kosis.kr/statHtml/statHtml.do?tblId=DT_133001N_4215&orgId=133";

const previous = JSON.parse(fs.readFileSync(incomePath, "utf8"));
const metaSource = fs.readFileSync(metaPath, "utf8");
const topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
const features = Object.values(topology.objects)[0].geometries.map((geometry) => ({
  code: String(geometry.properties.code),
  name: geometry.properties.name,
}));

const sidoRows = [...metaSource.matchAll(
  /\{ code: "(\d+)", slug: "([^"]+)", name: "([^"]+)", available: (?:true|false) \}/g
)].map(([, code, slug, name]) => ({ code, slug, name }));
if (sidoRows.length !== 17) throw new Error(`Expected 17 시/도 in regionMeta.ts, found ${sidoRows.length}`);

const sidoShortName = (name) => name
  .replace(/^충청북도$/, "충북")
  .replace(/^충청남도$/, "충남")
  .replace(/^전라남도$/, "전남")
  .replace(/^전라북도$|^전북특별자치도$/, "전북")
  .replace(/^경상북도$/, "경북")
  .replace(/^경상남도$/, "경남")
  .slice(0, 2);
const sidoByShortName = new Map(sidoRows.map((sido) => [sidoShortName(sido.name), sido]));
const findSido = (raw) => sidoByShortName.get(sidoShortName(raw.trim())) ?? null;

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
const toNumber = (value) => Number(String(value ?? "").replace(/[",\s]/g, ""));
const meanManwon = (workerCount, totalPayMillionWon) => Math.round((totalPayMillionWon / workerCount) * 100);

// ── Read input ───────────────────────────────────────────────────────────────

function splitLine(line, separator) {
  if (separator !== ",") return line.split(separator).map((cell) => cell.trim());
  const cells = [];
  let cell = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function readDelimited(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const separator = lines[0].includes("|") ? "|" : lines[0].includes("\t") ? "\t" : ",";
  return lines.map((line) => splitLine(line, separator));
}

// Returns { summary: [{ shortName, workerCount, total }], detail: [{ parent, name, workerCount, total }] }.
function parseRawCsv(file) {
  const [header, ...rows] = readDelimited(file);
  const col = (pattern) => header.findIndex((cell) => pattern.test(cell));

  // Normalized format.
  if (col(/^parent$/i) >= 0) {
    const [p, n, w, t] = [col(/^parent$/i), col(/^name$/i), col(/^workerCount$/i), col(/^totalPayMillionWon$/i)];
    if ([n, w, t].some((index) => index < 0)) throw new Error(`${file}: expected parent,name,workerCount,totalPayMillionWon`);
    return splitLevels(rows.map((r) => ({ parent: r[p], name: r[n], workerCount: toNumber(r[w]), total: toNumber(r[t]) })));
  }

  // KOSIS export: region columns like "주소지별(1)"/"주소지별(2)" (or "시도별"/"시군구별"),
  // value columns whose header mentions 인원 and 금액 for 급여총계.
  const levelCols = header.flatMap((cell, index) => /(주소지|시도|시군구|행정구역).*별/.test(cell) ? [index] : []);
  const workerCol = header.findIndex((cell) => /급여총계/.test(cell) && /인원/.test(cell));
  const totalCol = header.findIndex((cell) => /급여총계/.test(cell) && /금액/.test(cell));
  if (levelCols.length === 0 || workerCol < 0 || totalCol < 0) {
    throw new Error(
      `${file}: unrecognized layout. Header was: ${header.join(" | ")}\n` +
      "Export with rows = 주소지(시도, 시군구) and columns = 급여총계 인원, 급여총계 금액 — see data/raw/README.md."
    );
  }
  const parsed = [];
  let currentSido = "";
  for (const row of rows) {
    const levels = levelCols.map((index) => (row[index] ?? "").trim());
    const workerCount = toNumber(row[workerCol]);
    const total = toNumber(row[totalCol]);
    if (!Number.isFinite(workerCount) || !Number.isFinite(total) || workerCount <= 0) continue;
    // Single hierarchical column (indented names) vs one column per level.
    const [first, second = ""] = levels.length === 1 ? [levels[0], ""] : levels;
    if (first === "전국" || first === "계" || first === "합계") {
      parsed.push({ parent: "전국", name: "", workerCount, total });
    } else if (findSido(first) && (!second || /^(소계|계)$/.test(second))) {
      currentSido = first;
      parsed.push({ parent: first, name: "", workerCount, total });
    } else if (second) {
      parsed.push({ parent: first || currentSido, name: second, workerCount, total });
    } else if (currentSido) {
      parsed.push({ parent: currentSido, name: first, workerCount, total });
    }
  }
  return splitLevels(parsed);
}

function splitLevels(rows) {
  const summary = [];
  const detail = [];
  for (const row of rows) {
    if (row.parent === "전국" || !row.name) summary.push({ shortName: row.parent === "전국" ? "전국" : row.parent, workerCount: row.workerCount, total: row.total });
    else detail.push(row);
  }
  return { summary, detail };
}

function readInput() {
  const rawFiles = fs.existsSync(rawDir)
    ? fs.readdirSync(rawDir).flatMap((file) => {
        const match = file.match(/^kosis-sgg-income-(\d{4})\.(csv|tsv)$/);
        return match ? [{ file: path.join(rawDir, file), year: Number(match[1]) }] : [];
      })
    : [];
  rawFiles.sort((a, b) => b.year - a.year);
  if (rawFiles.length) {
    const { file, year } = rawFiles[0];
    return { year, label: path.relative(root, file).replace(/\\/g, "/"), ...parseRawCsv(file) };
  }
  const table = (file) => readDelimited(path.join(root, file)).slice(1);
  return {
    year: 2023,
    label: "data/kr/kosis-income-summary-2023.tsv + data/kr/kosis-sgg-income-2023.tsv",
    summary: table("data/kr/kosis-income-summary-2023.tsv").map(([shortName, w, t]) => ({ shortName, workerCount: toNumber(w), total: toNumber(t) })),
    detail: table("data/kr/kosis-sgg-income-2023.tsv").map(([parent, name, w, t]) => ({ parent, name, workerCount: toNumber(w), total: toNumber(t) })),
  };
}

const input = readInput();
const { year } = input;
const realFields = { source: SOURCE_NAME, year, isEstimate: false };

// ── 전국 + 시/도 ─────────────────────────────────────────────────────────────

const summaryRegions = input.summary.map(({ shortName, workerCount, total }) => {
  const sido = shortName === "전국" ? null : findSido(shortName);
  if (shortName !== "전국" && !sido) throw new Error(`Unknown summary region: ${shortName}`);
  return { name: sido?.name ?? "전국", level: sido ? "sido" : "national", mean: meanManwon(workerCount, total), ...realFields };
});
const sidoOrder = previous.regions.filter((r) => r.level === "sido").map((r) => r.name);
summaryRegions.sort((a, b) =>
  a.level === "national" ? -1 : b.level === "national" ? 1 : sidoOrder.indexOf(a.name) - sidoOrder.indexOf(b.name)
);
const missingSido = sidoRows.filter((sido) => !summaryRegions.some((r) => r.name === sido.name));
if (!summaryRegions.some((r) => r.level === "national") || missingSido.length) {
  throw new Error(`Summary is missing: ${[!summaryRegions.some((r) => r.level === "national") && "전국", ...missingSido.map((s) => s.name)].filter(Boolean).join(", ")}`);
}

// ── 시군구 (real) ────────────────────────────────────────────────────────────

// Keep slugs/display names stable across rebuilds so old links keep working.
const previousGu = previous.regions.filter((r) => r.level === "gu");
const previousByCode = new Map(previousGu.filter((r) => r.code).map((r) => [r.code, r]));

const realGu = input.detail.map(({ parent, name: rawName, workerCount, total }) => {
  const sido = findSido(parent);
  if (!sido) throw new Error(`Unknown 시/도 for detail row: ${parent}|${rawName}`);
  const candidates = shortNames(rawName);
  const mean = meanManwon(workerCount, total);
  let matches = features.filter((f) => f.code.startsWith(sido.code) && candidates.includes(normalize(f.name)));
  // e.g. 군위군: moved to 대구 in 2023, still under 경북's code on the 2018 map.
  if (matches.length === 0) matches = features.filter((f) => candidates.includes(normalize(f.name)));
  if (matches.length > 1) throw new Error(`Ambiguous map match: ${parent}|${rawName}`);

  if (matches.length === 1) {
    const { code } = matches[0];
    const prior = previousByCode.get(code);
    return {
      name: prior?.name ?? rawName.replace(/\([^)]*\)/g, "").trim(),
      level: "gu",
      parent: sido.name,
      parentSlug: sido.slug,
      slug: prior?.slug ?? `${sido.slug}-${code}`,
      code,
      mean,
      ...realFields,
    };
  }

  // Published city-wide only: no single polygon, children share a code prefix.
  const cityName = normalize(rawName.replace(/\([^)]*\)/g, ""));
  const children = features.filter((f) => f.code.startsWith(sido.code) && normalize(f.name).startsWith(cityName));
  const prefix = commonPrefix(children.map((f) => f.code));
  if (children.length < 2 || prefix.length < 3) throw new Error(`Cannot map to the 2018 map: ${parent}|${rawName}`);
  const prior = previousGu.find((r) => r.aggregation === "city" && r.parent === sido.name && candidates.includes(normalize(r.name)));
  return {
    name: prior?.name ?? rawName.replace(/\([^)]*\)/g, "").trim(),
    level: "gu",
    parent: sido.name,
    parentSlug: sido.slug,
    slug: prior?.slug ?? `${sido.slug}-${prefix}-city`,
    aggregation: "city",
    mean,
    ...realFields,
  };
});

// 세종: one boundary, no 시군구 split — the 시/도 total is the real value.
const sejong = sidoRows.find((s) => s.slug === "sejong");
const sejongFeature = features.find((f) => f.code.startsWith(sejong.code));
realGu.push({
  name: sejongFeature.name,
  level: "gu",
  parent: sejong.name,
  parentSlug: sejong.slug,
  slug: "sejong-city",
  code: sejongFeature.code,
  aggregation: "city",
  mean: summaryRegions.find((r) => r.name === sejong.name).mean,
  ...realFields,
});

// ── 시군구 (estimates for every polygon still without a value) ──────────────

const coveredCodes = new Set(realGu.flatMap((r) => (r.code ? [r.code] : [])));
const sidoForCode = (code) => sidoRows.find((s) => code.startsWith(s.code));
const estimates = features
  .filter((f) => !coveredCodes.has(f.code))
  .map((f) => {
    const sido = sidoForCode(f.code);
    if (!sido) throw new Error(`Map polygon outside the 17 시/도: ${f.code} ${f.name}`);
    const city = realGu.find((r) =>
      r.aggregation === "city" && r.parentSlug === sido.slug && normalize(f.name).startsWith(normalize(r.name))
    );
    const basis = city ?? summaryRegions.find((r) => r.name === sido.name);
    const cityPrefix = city ? city.name.replace(/\s/g, "") : "";
    const displayName = city && f.name.startsWith(cityPrefix) ? `${cityPrefix} ${f.name.slice(cityPrefix.length)}` : f.name;
    return {
      name: displayName,
      level: "gu",
      parent: sido.name,
      parentSlug: sido.slug,
      slug: previousByCode.get(f.code)?.slug ?? `${sido.slug}-${f.code}`,
      code: f.code,
      mean: basis.mean,
      source: `추정: ${basis.name} 평균을 그대로 적용 (${SOURCE_NAME})`,
      year,
      isEstimate: true,
      estimateMethod: city ? "city-mean" : "sido-mean",
      estimateBasis: city ? city.slug : sido.slug,
    };
  });

const guRegions = [...realGu, ...estimates].sort((a, b) =>
  a.parent.localeCompare(b.parent, "ko") || a.name.localeCompare(b.name, "ko")
);

const slugs = guRegions.map((r) => r.slug);
if (new Set(slugs).size !== slugs.length) throw new Error("Duplicate 시군구 slugs");
const codes = guRegions.flatMap((r) => (r.code ? [r.code] : []));
if (new Set(codes).size !== codes.length) throw new Error("Duplicate map codes");
const uncovered = features.filter((f) => !codes.includes(f.code));
if (uncovered.length) throw new Error(`Map polygons left without a value: ${uncovered.map((f) => f.name).join(", ")}`);

// ── Write ────────────────────────────────────────────────────────────────────

const cityNames = realGu.filter((r) => r.aggregation === "city" && r.slug !== "sejong-city").map((r) => r.name.replace(/시$/, ""));
const output = {
  meta: {
    source: `${SOURCE_NAME} (${SOURCE_URL}), ${year}년 귀속. 원자료: ${input.label}.`,
    unit: "만원 (세전 연봉 평균, 근로소득 연말정산 신고 기준)",
    asOf: `전국·17개 시/도·시군구 모두 KOSIS ${year}년 귀속 자료 기준.`,
    note:
      `주소지 기준 급여총계 금액(백만원)을 급여총계 인원(명)으로 나눈 뒤 만원 단위로 반올림했다. ` +
      `공식 표가 시 전체로만 제공하는 ${cityNames.join("·")}은 시 전체 평균을 실제값으로 두고, ` +
      `그 아래 일반구 지도 경계에는 같은 시 전체 평균을 추정치(isEstimate: true)로 표시한다. ` +
      `세종은 단일 경계라 시/도 총계를 그대로 쓴다. 읍·면·동 단위 평균은 제공하지 않는다.`,
    generatedAt: new Date().toISOString().slice(0, 10),
  },
  regions: [...summaryRegions, ...guRegions],
};
fs.writeFileSync(incomePath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  input: input.label,
  year,
  sido: summaryRegions.filter((r) => r.level === "sido").length,
  realGuRows: realGu.length,
  cityWideRows: realGu.filter((r) => r.aggregation === "city").length,
  estimateRows: estimates.length,
  estimateByMethod: estimates.reduce((acc, r) => ({ ...acc, [r.estimateMethod]: (acc[r.estimateMethod] ?? 0) + 1 }), {}),
  mapPolygons: features.length,
  mapPolygonsWithoutValue: uncovered.length,
}, null, 2));
