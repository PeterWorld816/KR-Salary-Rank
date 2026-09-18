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
};

export const DEFAULT_KR_INPUT: KrInput = { annualIncome: 4000, occupationId: "general" };

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
  };
}

export function buildKrSearchParams(input: KrInput, lang: string): URLSearchParams {
  return new URLSearchParams({ d: encodeKrInput(input), o: input.occupationId, lang });
}
import { getOccupationById } from "@/data/kr/occupations";
