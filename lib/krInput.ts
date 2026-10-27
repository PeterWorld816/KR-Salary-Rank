// Codec for the visitor's input. Day to day the input lives in
// lib/krInputStore.ts (React state + sessionStorage), never in the URL; `d`/`o`
// only appear in share links built by buildKrShareSearch, and in older
// `?d=` links, both of which the store reads once and then strips.
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

// The one place `d`/`o` are written into a URL: the /result share link.
export function buildKrShareSearch(input: KrInput, region: string, gu: string | null): string {
  const params = new URLSearchParams({ region });
  if (gu) params.set("gu", gu);
  params.set("d", encodeKrInput(input));
  params.set("o", input.occupationId);
  return params.toString();
}
import { getOccupationById } from "@/data/kr/occupations";
