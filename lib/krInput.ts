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
};

export const DEFAULT_KR_INPUT: KrInput = { annualIncome: 4000 };

export function encodeKrInput(input: KrInput): string {
  return String(input.annualIncome);
}

export function decodeKrInput(raw: string): KrInput | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? { annualIncome: n } : null;
}

export function readKrInputFromSearch(sp: URLSearchParams | { get(k: string): string | null }): KrInput {
  return decodeKrInput(sp.get("d") ?? "") ?? DEFAULT_KR_INPUT;
}

export function buildKrSearchParams(input: KrInput, lang: string): URLSearchParams {
  return new URLSearchParams({ d: encodeKrInput(input), lang });
}
