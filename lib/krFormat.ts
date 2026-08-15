// 만원 formatting shared by the /kr section — mirrors lib/usFormat.ts's role
// for USD. All KR income figures (data/kr/regionIncome.json, KrInput) are
// stored in 만원 (10,000 KRW) units, the unit KOSIS itself publishes in.
export function formatManwon(value: number): string {
  if (value >= 10000) return `${(value / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억원`;
  return `${Math.round(value).toLocaleString("ko-KR")}만원`;
}

// Shorter form for tight spaces (e.g. the collapsed input panel's one-line
// summary chip) — same rounding rule as formatManwon, just no trailing "원".
export function formatManwonCompact(value: number): string {
  if (value >= 10000) return `${(value / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`;
  return `${Math.round(value).toLocaleString("ko-KR")}만`;
}

// Full-won amount for a 만원 value, e.g. 4425 -> "44,250,000원" — used where
// the precise annual figure reads better spelled out than compressed.
export function formatWonFromManwon(manwon: number): string {
  return `${Math.round(manwon * 10000).toLocaleString("ko-KR")}원`;
}
