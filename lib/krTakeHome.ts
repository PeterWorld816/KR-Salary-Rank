// Browser-only estimates for the result page's "내 소득으로 뭘 할 수 있나"
// section: 세후 월 실수령액 and a DSR-based mortgage reference. Pure functions
// over lib/kr-constants.ts — no I/O, nothing leaves the browser.
//
// Take-home is an annual 연말정산-style estimate, not the monthly 간이세액표:
// 1인 가구, 비과세 수당 없음, 부양가족·신용카드·기타 공제 없음. Real payslips
// differ (withholding uses the 간이세액표; 식대 등 비과세가 있으면 더 받는다).
import {
  NATIONAL_PENSION,
  HEALTH_INSURANCE,
  LONG_TERM_CARE,
  EMPLOYMENT_INSURANCE,
  EARNED_INCOME_DEDUCTION,
  BASIC_PERSONAL_DEDUCTION,
  INCOME_TAX_BRACKETS,
  EARNED_INCOME_TAX_CREDIT,
  earnedIncomeTaxCreditLimit,
  LOCAL_INCOME_TAX_RATE,
  MORTGAGE_REFERENCE,
} from "@/lib/kr-constants";

export type KrTakeHome = {
  // all monthly, 원
  gross: number;
  pension: number;
  health: number;
  longTermCare: number;
  employment: number;
  incomeTax: number;
  localTax: number;
  net: number;
};

const floor10 = (won: number) => Math.floor(won / 10) * 10;

function earnedIncomeDeduction(grossWon: number): number {
  const b = EARNED_INCOME_DEDUCTION.brackets.find((x) => grossWon <= x.upTo)!;
  return Math.min(b.base + (grossWon - b.over) * b.rate, EARNED_INCOME_DEDUCTION.max);
}

function progressiveTax(taxBaseWon: number): number {
  if (taxBaseWon <= 0) return 0;
  const b = INCOME_TAX_BRACKETS.brackets.find((x) => taxBaseWon <= x.upTo)!;
  return taxBaseWon * b.rate - b.deduction;
}

export function estimateKrTakeHome(annualIncomeManwon: number): KrTakeHome {
  const grossYear = Math.max(0, annualIncomeManwon) * 10_000;
  const grossMonth = grossYear / 12;

  const pensionBase = Math.min(Math.max(grossMonth, NATIONAL_PENSION.monthlyBaseMin), NATIONAL_PENSION.monthlyBaseMax);
  const pension = grossMonth > 0 ? floor10(pensionBase * NATIONAL_PENSION.employeeRate) : 0;
  const health = floor10(Math.min(grossMonth * HEALTH_INSURANCE.employeeRate, HEALTH_INSURANCE.employeeMonthlyMax));
  const longTermCare = floor10(health * LONG_TERM_CARE.rateOfHealthPremium);
  const employment = floor10(grossMonth * EMPLOYMENT_INSURANCE.employeeRate);

  // 과세표준 = 총급여 − 근로소득공제 − 본인 기본공제 − 연금보험료공제 − 보험료 특별소득공제
  const taxBase =
    grossYear -
    earnedIncomeDeduction(grossYear) -
    BASIC_PERSONAL_DEDUCTION -
    pension * 12 -
    (health + longTermCare + employment) * 12;
  const computed = progressiveTax(taxBase);
  const c = EARNED_INCOME_TAX_CREDIT;
  const credit = Math.min(
    computed <= c.lowTaxThreshold ? computed * c.lowRate : c.highBase + (computed - c.lowTaxThreshold) * c.highRate,
    earnedIncomeTaxCreditLimit(grossYear)
  );
  const incomeTaxYear = Math.max(0, computed - credit);
  const incomeTax = floor10(incomeTaxYear / 12);
  const localTax = floor10(incomeTax * LOCAL_INCOME_TAX_RATE);

  const net = grossMonth - pension - health - longTermCare - employment - incomeTax - localTax;
  return { gross: grossMonth, pension, health, longTermCare, employment, incomeTax, localTax, net: Math.max(0, net) };
}

// 원리금균등상환 기준, 연 원리금이 DSR 한도(연소득 × 40%)를 넘지 않는 최대 대출액(원).
// 다른 대출이 없다는 가정 — see MORTGAGE_REFERENCE.
export function estimateDsrLoanLimit(annualIncomeManwon: number): number {
  const { dsrLimit, assumedAnnualRate, assumedYears } = MORTGAGE_REFERENCE;
  const monthlyPayment = (annualIncomeManwon * 10_000 * dsrLimit) / 12;
  const i = assumedAnnualRate / 12;
  const n = assumedYears * 12;
  return monthlyPayment * ((1 - Math.pow(1 + i, -n)) / i);
}
