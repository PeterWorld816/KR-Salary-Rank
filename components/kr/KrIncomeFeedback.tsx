// "내 소득으로 뭘 할 수 있나" — the result page's feedback section: where the
// income sits, what the next tier takes, an estimated monthly take-home, and
// what that could mean for savings / a mortgage. Everything is computed here
// in the browser from props + lib/kr-constants.ts; nothing is sent anywhere.
// Uses the existing tier labels (lib/tier.ts) — no new grading scale.
import { Calculator, Home, PiggyBank, Target, Users } from "lucide-react";
import type { KrIncomeComparisonRow } from "@/lib/krIncomeCalc";
import { estimateIncomeAtTopPercent } from "@/lib/krIncomeCalc";
import { estimateKrTakeHome, estimateDsrLoanLimit } from "@/lib/krTakeHome";
import { MORTGAGE_REFERENCE, SAVINGS_SCENARIO_RATES } from "@/lib/kr-constants";
import { getNextTier } from "@/lib/tier";
import { formatManwon } from "@/lib/krFormat";
import EstimateBadge from "@/components/kr/EstimateBadge";

const won = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const manwonFromWon = (value: number) => formatManwon(Math.round(value / 10_000));
const multiple = (ratioPercent: number) => (ratioPercent / 100).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-tertiary">{children}</span>
  );
}

function Card({ icon, title, tag, children }: { icon: React.ReactNode; title: string; tag?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-caption font-bold text-text">
          <span className="text-accent">{icon}</span>
          {title}
        </h3>
        {tag && <Pill>{tag}</Pill>}
      </div>
      {children}
    </div>
  );
}

function livingComment(ratioPercent: number, region: string): string {
  if (ratioPercent >= 150) return `${region} 평균보다 꽤 넉넉한 편이에요. 저축 비율을 조금 더 높여볼 여유가 있어요.`;
  if (ratioPercent >= 110) return `${region} 평균보다 조금 여유 있는 편이에요. 꾸준히 모으는 습관이 차이를 만들어요.`;
  if (ratioPercent >= 90) return `${region} 평균과 비슷한 수준이에요. 고정비를 한 번 점검하면 저축 여력을 만들기 좋아요.`;
  return `${region} 평균보다는 빠듯할 수 있어요. 고정 지출부터 살펴보면 조금씩 여유가 생겨요.`;
}

export default function KrIncomeFeedback({
  annualIncome,
  rows,
  best,
}: {
  annualIncome: number; // 만원
  rows: KrIncomeComparisonRow[];
  best: KrIncomeComparisonRow;
}) {
  const national = rows.find((r) => r.level === "national")!;
  const local = rows.filter((r) => r.level !== "national");
  const next = getNextTier(best.estimatedTopPercent);
  const nextIncome = next ? estimateIncomeAtTopPercent(next.topPercent, best.mean) : null;
  const nextGap = nextIncome != null ? Math.max(0, Math.ceil(nextIncome - annualIncome)) : null;
  const takeHome = estimateKrTakeHome(annualIncome);
  const deductions = [
    { label: "국민연금", value: takeHome.pension },
    { label: "건강보험", value: takeHome.health },
    { label: "장기요양보험", value: takeHome.longTermCare },
    { label: "고용보험", value: takeHome.employment },
    { label: "근로소득세", value: takeHome.incomeTax },
    { label: "지방소득세", value: takeHome.localTax },
  ];
  const totalDeduction = deductions.reduce((sum, d) => sum + d.value, 0);
  const loanLimit = estimateDsrLoanLimit(annualIncome);

  return (
    <section aria-labelledby="kr-feedback-title" className="mb-8">
      <h2 id="kr-feedback-title" className="text-title font-bold text-text">내 소득으로 뭘 할 수 있을까요?</h2>
      <p className="mb-4 mt-1 text-caption text-text-tertiary">입력한 연봉으로 브라우저에서만 계산했어요. 서버로 보내지 않아요.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card icon={<Users className="h-4 w-4" />} title="내 위치" tag="추정">
          <p className="text-caption text-text-tertiary">{best.name} 사람 100명을 연봉순으로 줄 세우면</p>
          <p className="mt-1 text-title font-bold tabular-nums text-text">
            앞에서 <span className="text-accent">{best.estimatedTopPercent}번째</span>
          </p>
          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-caption">
            {[national, ...local].map((row) => (
              <div key={row.level} className="flex items-center justify-between gap-3">
                <dt className="flex min-w-0 items-center gap-1.5 text-text-secondary">
                  <span className="truncate">{row.name} 평균 대비</span>
                  {row.estimateNote && <EstimateBadge note={row.estimateNote} />}
                </dt>
                <dd className="shrink-0 font-bold tabular-nums text-text">{multiple(row.ratioPercent)}배</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-secondary">같은 연령대 평균 대비</dt>
              <dd>
                <Pill>준비중</Pill>
              </dd>
            </div>
          </dl>
        </Card>

        <Card icon={<Target className="h-4 w-4" />} title="다음 목표" tag="추정">
          {next && nextGap != null && nextIncome != null ? (
            <>
              <p className="text-caption text-text-tertiary">
                {next.tier.emoji} {next.tier.label}(상위 {next.topPercent}%)까지
              </p>
              <p className="mt-1 text-title font-bold tabular-nums text-text">
                연 <span className="text-accent">{formatManwon(nextGap)}</span> 더
              </p>
              <p className="mt-3 border-t border-border pt-3 text-caption leading-relaxed text-text-secondary">
                {best.name} 기준 상위 {next.topPercent}%는 연 {formatManwon(Math.ceil(nextIncome))} 정도예요. 월 세전으로는 약{" "}
                {formatManwon(Math.ceil(nextGap / 12))}씩 더 받는 셈이에요.
              </p>
            </>
          ) : (
            <>
              <p className="text-title font-bold text-text">이미 가장 높은 구간이에요 🏆</p>
              <p className="mt-2 text-caption text-text-secondary">{best.name} 기준 추정 상위 1% 안에 들어요.</p>
            </>
          )}
        </Card>

        <Card icon={<Calculator className="h-4 w-4" />} title="세후 월 실수령액" tag="추정치">
          <p className="text-title font-bold tabular-nums text-text">
            약 <span className="text-accent">{manwonFromWon(takeHome.net)}</span>
          </p>
          <p className="mt-0.5 text-caption tabular-nums text-text-tertiary">
            세전 월 {won(takeHome.gross)} − 공제 {won(totalDeduction)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border pt-3 text-caption">
            {deductions.map((d) => (
              <div key={d.label} className="flex justify-between gap-2">
                <dt className="text-text-tertiary">{d.label}</dt>
                <dd className="tabular-nums text-text-secondary">{won(d.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-text-tertiary">
            2026년 요율, 1인 가구·비과세 수당 없음·부양가족 공제 없음 가정. 실제 급여명세서와 다를 수 있어요.
          </p>
        </Card>

        <Card icon={<PiggyBank className="h-4 w-4" />} title="월 저축 시나리오">
          <ul className="space-y-2">
            {SAVINGS_SCENARIO_RATES.map((rate) => {
              const monthly = takeHome.net * rate;
              return (
                <li key={rate} className="flex items-baseline justify-between gap-3">
                  <span className="text-caption text-text-secondary">실수령액의 {Math.round(rate * 100)}%</span>
                  <span className="text-right">
                    <span className="block text-body font-bold tabular-nums text-text">월 {manwonFromWon(monthly)}</span>
                    <span className="block text-[11px] tabular-nums text-text-tertiary">1년이면 {manwonFromWon(monthly * 12)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-border pt-3 text-caption leading-relaxed text-text-secondary">
            {livingComment(best.ratioPercent, best.name)}
          </p>
        </Card>
      </div>

      <div className="mt-3">
        <Card icon={<Home className="h-4 w-4" />} title="주택담보대출 한도 참고치" tag="참고">
          <p className="text-title font-bold tabular-nums text-text">
            최대 약 <span className="text-accent">{manwonFromWon(loanLimit)}</span>
          </p>
          <p className="mt-2 text-caption leading-relaxed text-text-secondary">
            DSR {Math.round(MORTGAGE_REFERENCE.dsrLimit * 100)}% 기준, 다른 대출이 없고 연 {(MORTGAGE_REFERENCE.assumedAnnualRate * 100).toFixed(1)}%·
            {MORTGAGE_REFERENCE.assumedYears}년 원리금균등상환을 가정한 계산이에요. 연 원리금 상환액이 연봉의{" "}
            {Math.round(MORTGAGE_REFERENCE.dsrLimit * 100)}%({manwonFromWon(annualIncome * 10_000 * MORTGAGE_REFERENCE.dsrLimit)})를 넘지 않는 금액입니다.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-tertiary">
            스트레스 DSR, LTV, 기존 대출, 금융회사별 심사 기준은 반영하지 않았어요. 실제 한도는 금융회사에서 확인하세요.
          </p>
        </Card>
      </div>

      <p className="mt-3 rounded-xl bg-bg-subtle/70 px-4 py-3 text-caption text-text-tertiary">
        통계 기반 참고 정보이며 금융 자문이 아닙니다. 세금·보험료·대출 계산은 모두 단순화한 추정치예요.
      </p>
    </section>
  );
}
