// Server-only topojson -> GeoJSON conversion for the /kr 시도 map — same
// pattern as lib/usGeo.ts, just fed by data/kr/skorea-provinces-2018-topo-simple.json
// (source: southkorea/southkorea-maps, KOGL Type 1 license, no account
// required) instead of us-atlas. v1 is 시도(province)-level only; a
// 시군구-level topology can be added the same way once more regions have
// real income data (see data/kr/regionIncome.json's meta.note).
import "server-only";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import provincesTopology from "@/data/kr/skorea-provinces-2018-topo-simple.json";

export type KrGeoProps = { name: string; code: string };
export type KrFeatureCollection = FeatureCollection<Geometry, KrGeoProps>;

let sidoGeoCache: KrFeatureCollection | null = null;

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
