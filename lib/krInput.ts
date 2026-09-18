// Query-string codec for the /kr section — mirrors lib/usInput.ts's "?d=..."
// pattern so the visitor's income survives navigation from /kr -> /kr/[region]
// -> /kr/result without a server round trip.
//
// Deliberately just one field: unlike /us, there's no per-region gender/
// marital-status/age-band income breakdown to compare against (see
// data/kr/regionIncome.json's meta.note), so KrInputPanel shows those fields
// disabled/"준비중" rather than collecting answers that would have nowhere
// to feed into.

export type KrInput = {
  annualIncome: number; // 만원, pre-tax — the only real input
  occupationId: string;
  ageBand: "20s" | "30s" | "40s" | "50s";
  maritalStatus: "single" | "married";
};

export const DEFAULT_KR_INPUT: KrInput = { annualIncome: 4000, occupationId: "general", ageBand: "30s", maritalStatus: "single" };

export function encodeKrInput(input: KrInput): string {
  return String(input.annualIncome);
}

export function decodeKrInput(raw: string): { annualIncome: number } | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? { annualIncome: n } : null;
}

export function readKrInputFromSearch(sp: URLSearchParams | { get(k: string): string | null }): KrInput {
  const income = decodeKrInput(sp.get("d") ?? "");
  return {
    annualIncome: income?.annualIncome ?? DEFAULT_KR_INPUT.annualIncome,
    occupationId: getOccupationById(sp.get("o") || DEFAULT_KR_INPUT.occupationId).id,
    ageBand: ["20s", "30s", "40s", "50s"].includes(sp.get("a") ?? "") ? (sp.get("a") as KrInput["ageBand"]) : DEFAULT_KR_INPUT.ageBand,
    maritalStatus: sp.get("m") === "married" ? "married" : DEFAULT_KR_INPUT.maritalStatus,
  };
}

export function buildKrSearchParams(input: KrInput, lang: string): URLSearchParams {
  return new URLSearchParams({ d: encodeKrInput(input), o: input.occupationId, a: input.ageBand, m: input.maritalStatus, lang });
}
import { getOccupationById } from "@/data/kr/occupations";
