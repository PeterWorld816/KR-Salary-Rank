// Server-rendered write-up + 시군구 table for /[region] — passed into
// KrRegionClient as children so it lands in the static HTML. Content comes
// from lib/krRegionNarrative.ts.
import type { KrRegionNarrative } from "@/lib/krRegionNarrative";
import EstimateBadge from "@/components/kr/EstimateBadge";

export default function KrRegionReport({ regionName, narrative }: { regionName: string; narrative: KrRegionNarrative }) {
  return (
    <section aria-labelledby="kr-region-report-title" className="mt-10">
      <h2 id="kr-region-report-title" className="mb-4 text-title font-bold text-text">
        {regionName} 근로소득 한눈에 보기
      </h2>
      <div className="space-y-4">
        {narrative.paragraphs.map((p) => (
          <p key={p.slice(0, 40)} className="text-body leading-8 text-text-secondary">
            {p}
          </p>
        ))}
      </div>

      {narrative.rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[320px] text-left text-caption">
            <caption className="sr-only">
              {regionName} 시군구별 1인당 평균 총급여, {narrative.year}년 귀속, 단위 만원
            </caption>
            <thead className="bg-bg-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3">순위</th>
                <th className="px-4 py-3">시군구</th>
                <th className="px-4 py-3 text-right">평균 연봉</th>
                <th className="px-4 py-3 text-right">전국 대비</th>
              </tr>
            </thead>
            <tbody>
              {narrative.rows.map((row) => (
                <tr key={row.name} className="border-t border-border">
                  <td className="px-4 py-3 tabular-nums text-text-tertiary">{row.rank ?? "–"}</td>
                  <th scope="row" className="px-4 py-3 font-medium text-text">
                    <span className="inline-flex items-center gap-1.5">
                      {row.name}
                      {row.isCityWide && <span className="text-[11px] font-normal text-text-tertiary">시 전체</span>}
                      {row.isEstimate && (
                        <EstimateBadge note="구별 공식 통계가 없어 소속 시 전체 평균을 그대로 표시한 추정치예요." inline />
                      )}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums text-text">{row.mean.toLocaleString("ko-KR")}만원</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{row.vsNationalPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-caption text-text-tertiary">
            출처: 국세청 국세통계 근로소득 연말정산 신고현황(주소지), KOSIS {narrative.year}년 귀속. 추정 행은 순위에서 제외했습니다.
          </p>
        </div>
      )}
    </section>
  );
}
