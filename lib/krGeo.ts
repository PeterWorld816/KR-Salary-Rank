// Server-only topojson -> GeoJSON conversion for /kr's 시도 and 시군구 maps —
// same pattern as lib/usGeo.ts's states-10m/counties-10m split, just fed by
// southkorea/southkorea-maps (KOGL Type 1 license, no account required)
// instead of us-atlas: data/kr/skorea-provinces-2018-topo-simple.json for
// 시도, data/kr/skorea-municipalities-2018-topo-simple.json for 시군구.
import "server-only";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import provincesTopology from "@/data/kr/skorea-provinces-2018-topo-simple.json";
import municipalitiesTopology from "@/data/kr/skorea-municipalities-2018-topo-simple.json";
import { KR_GU, getSidoBySlug } from "@/data/kr/regionMeta";

export type KrGeoProps = { name: string; code: string };
export type KrFeatureCollection = FeatureCollection<Geometry, KrGeoProps>;

let sidoGeoCache: KrFeatureCollection | null = null;
let guGeoCache: KrFeatureCollection | null = null;

export function getKrSidoGeo(): KrFeatureCollection {
  if (!sidoGeoCache) {
    const objectKey = Object.keys((provincesTopology as any).objects)[0];
    const collection = feature(provincesTopology as any, (provincesTopology as any).objects[objectKey]) as unknown as KrFeatureCollection;
    // The topojson has no top-level feature.id — give every feature one
    // (its province code) so KrMap can key off `f.id` exactly like UsMap
    // does with FIPS, instead of reaching into `.properties` everywhere.
    sidoGeoCache = {
      type: "FeatureCollection",
      features: collection.features.map((f) => ({ ...f, id: f.properties.code })),
    };
  }
  return sidoGeoCache;
}

function getAllKrGuGeo(): KrFeatureCollection {
  if (!guGeoCache) {
    const objectKey = Object.keys((municipalitiesTopology as any).objects)[0];
    const collection = feature(municipalitiesTopology as any, (municipalitiesTopology as any).objects[objectKey]) as unknown as KrFeatureCollection;
    // Each feature's `code` is a 5-digit 시군구 code whose first 2 digits are
    // its parent 시도's code (data/kr/regionMeta.ts's SidoMeta.code) — same
    // key every GuMeta.code in regionMeta.ts uses, so KrMap can join a
    // clicked gu polygon straight back to a slug via that code.
    guGeoCache = {
      type: "FeatureCollection",
      features: collection.features.map((f) => ({ ...f, id: f.properties.code })),
    };
  }
  return guGeoCache;
}

// All 시군구 belonging to one 시도. Use explicit metadata when available so
// transferred districts such as 군위군 follow their current statistical
// parent; fall back to the topology's code prefix for other polygons.
export function getKrGuGeoForSido(sidoCode: string): KrFeatureCollection {
  const all = getAllKrGuGeo();
  const parentSlugByCode = new Map(
    KR_GU.flatMap((gu) => gu.code ? [[gu.code, gu.parentSlug] as const] : [])
  );
  return {
    type: "FeatureCollection",
    features: all.features.filter((f) => {
      const code = String(f.id);
      const parentSlug = parentSlugByCode.get(code);
      const mappedSido = parentSlug ? getSidoBySlug(parentSlug) : null;
      return mappedSido ? mappedSido.code === sidoCode : code.slice(0, 2) === sidoCode;
    }),
  };
}
