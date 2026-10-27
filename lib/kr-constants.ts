// Every rate and threshold the result page's take-home / loan estimates use,
// in one place. Amounts in 원 unless noted. When a figure changes, update it
// here together with its 기준연도 and 출처 — nothing else hardcodes these.
// The UI labels every number derived from this file as "추정치".

// ── 4대보험 (근로자 본인 부담분) ─────────────────────────────────────────────

// 국민연금: 보험료율 9.5% (2026.1.1~, 2025년 연금개혁으로 매년 0.5%p 인상 → 2027년 10%),
// 직장가입자는 절반 부담. 기준소득월액 상·하한 659만/41만원 (2026.7.1~2027.6.30 적용,
// 보건복지부 2026년 제1차 국민연금심의위원회). 출처: 국민연금법 제88조, 국민연금공단 공지.
export const NATIONAL_PENSION = {
  year: 2026,
  employeeRate: 0.095 / 2,
  monthlyBaseMin: 410_000,
  monthlyBaseMax: 6_590_000,
} as const;

// 건강보험: 보험료율 7.19% (2026년, 2025년 7.09%), 직장가입자 절반 부담.
// 본인 부담 월 보험료 상한 4,591,740원 (2026년). 출처: 국민건강보험공단
// 「2026년 달라지는 건강·장기요양제도 안내」.
export const HEALTH_INSURANCE = {
  year: 2026,
  employeeRate: 0.0719 / 2,
  employeeMonthlyMax: 4_591_740,
} as const;

// 장기요양보험: 소득 대비 0.9448% (2026년). 실제 부과는 건강보험료 × (0.9448 / 7.19)
// = 건강보험료의 약 13.14%. 출처: 국민건강보험공단 같은 안내.
export const LONG_TERM_CARE = {
  year: 2026,
  rateOfHealthPremium: 0.9448 / 7.19,
} as const;

// 고용보험(실업급여): 1.8%, 근로자 절반 0.9%. 출처: 고용보험 및 산업재해보상보험의
// 보험료징수 등에 관한 법률 시행령 제12조.
export const EMPLOYMENT_INSURANCE = {
  year: 2026,
  employeeRate: 0.009,
} as const;

// ── 근로소득세 (연말정산 결정세액 기준 간이 계산) ────────────────────────────

// 근로소득공제 (소득세법 제47조, 한도 2,000만원). [총급여 상한, 기본 공제액, 초과분 공제율].
export const EARNED_INCOME_DEDUCTION = {
  year: 2026,
  brackets: [
    { upTo: 5_000_000, base: 0, rate: 0.7, over: 0 },
    { upTo: 15_000_000, base: 3_500_000, rate: 0.4, over: 5_000_000 },
    { upTo: 45_000_000, base: 7_500_000, rate: 0.15, over: 15_000_000 },
    { upTo: 100_000_000, base: 12_000_000, rate: 0.05, over: 45_000_000 },
    { upTo: Infinity, base: 14_750_000, rate: 0.02, over: 100_000_000 },
  ],
  max: 20_000_000,
} as const;

// 기본공제 본인 1인 150만원 (소득세법 제50조). 부양가족·자녀 공제는 반영하지 않는다.
export const BASIC_PERSONAL_DEDUCTION = 1_500_000;

// 종합소득세율 (소득세법 제55조, 2023년 귀속부터 적용 중인 구간).
// [과세표준 상한, 세율, 누진공제].
export const INCOME_TAX_BRACKETS = {
  year: 2026,
  brackets: [
    { upTo: 14_000_000, rate: 0.06, deduction: 0 },
    { upTo: 50_000_000, rate: 0.15, deduction: 1_260_000 },
    { upTo: 88_000_000, rate: 0.24, deduction: 5_760_000 },
    { upTo: 150_000_000, rate: 0.35, deduction: 15_440_000 },
    { upTo: 300_000_000, rate: 0.38, deduction: 19_940_000 },
    { upTo: 500_000_000, rate: 0.4, deduction: 25_940_000 },
    { upTo: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { upTo: Infinity, rate: 0.45, deduction: 65_940_000 },
  ],
} as const;

// 근로소득세액공제 (소득세법 제59조, 국세청 안내). 산출세액 130만원 이하 55%,
// 초과분 30%(+71만5천원). 한도는 총급여 구간별로 74만→66만→50만→20만원까지 감소.
export const EARNED_INCOME_TAX_CREDIT = {
  year: 2026,
  lowTaxThreshold: 1_300_000,
  lowRate: 0.55,
  highBase: 715_000,
  highRate: 0.3,
} as const;

export function earnedIncomeTaxCreditLimit(grossWon: number): number {
  if (grossWon <= 33_000_000) return 740_000;
  if (grossWon <= 70_000_000) return Math.max(740_000 - (grossWon - 33_000_000) * 0.008, 660_000);
  if (grossWon <= 120_000_000) return Math.max(660_000 - (grossWon - 70_000_000) / 2, 500_000);
  return Math.max(500_000 - (grossWon - 120_000_000) / 2, 200_000);
}

// 지방소득세: 근로소득세의 10% (지방세법 제103조의3).
export const LOCAL_INCOME_TAX_RATE = 0.1;

// ── 참고치용 가정 (통계·법령이 아닌 이 사이트의 가정) ──────────────────────

// DSR 40%: 은행권 차주단위 총부채원리금상환비율 한도 (금융위원회 가계부채 관리방안).
// 금리·만기는 계산을 위한 가정일 뿐 시장 금리나 특정 상품을 뜻하지 않는다.
// 스트레스 DSR, LTV, 기존 대출, 은행별 심사는 반영하지 않는다.
export const MORTGAGE_REFERENCE = {
  dsrLimit: 0.4,
  assumedAnnualRate: 0.04,
  assumedYears: 30,
} as const;

// 월 저축 시나리오: 세후 월 실수령액의 비율.
export const SAVINGS_SCENARIO_RATES = [0.1, 0.2, 0.3] as const;
