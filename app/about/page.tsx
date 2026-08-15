import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { krRegionIncomeMeta } from "@/lib/krIncomeCalc";

const TITLE = "사이트 소개 — 내 소득 상위 몇 %?";
const DESCRIPTION = "이 사이트가 무엇을 하는지, 소득 데이터와 지도가 어디서 오는지 소개합니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/about") },
};

export default function KrAboutPage() {
  return (
    <LegalPage title="사이트 소개" backLabel="홈으로" backHref="/">
      <LegalSection heading="무엇을 하는 사이트인가요">
        <p>
          이 사이트는 당신의 연 소득이 전국·시/도·시군구 평균과 비교해 어느 위치에 있는지 확인할 수 있게 해줍니다. 소득을 한 번
          입력한 뒤 지도에서 지역을 골라 실제 국세청 통계와 비교해보세요.
        </p>
      </LegalSection>

      <LegalSection heading="데이터 출처">
        <p>이 사이트에 표시되는 지역 평균 소득은 아래 출처에서 담당자가 직접 확인한 실측값이며, 임의로 추정한 값이 아닙니다:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-white/85">국세청 국세통계 4.2.15 — 시군구별 근로소득 연말정산 신고현황 (2023년 귀속)</span>
            <br />
            <span className="text-white/55">tblId DT_133001N_4215, orgId 133, KOSIS(국가통계포털)에서 조회.</span>
          </li>
          <li>
            <span className="font-semibold text-white/85">국세청 2024.12 4차 국세통계 브리핑 보도자료</span>
            <br />
            <span className="text-white/55">시/도 단위 평균 중 일부 수치의 출처.</span>
          </li>
        </ul>
        <p className="text-white/55">
          기준 시점: {krRegionIncomeMeta.asOf}. 아직 수치를 확보하지 못한 지역(부산·대구·광주·강원·전북·제주 등)은
          &ldquo;준비중&rdquo;으로만 표시하고, 절대 추정치로 채우지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="추정 백분위에 대하여">
        <p>
          결과 화면의 &ldquo;추정 소득 상위 X%&rdquo; 수치는 실제 국세청 분위(percentile) 데이터가 아닙니다. 지역 평균만 알고
          있을 뿐 실제 소득 분포는 공개되어 있지 않기 때문에, 소득이 로그정규분포를 따른다고 가정하고 계산한 근사치입니다.
          메인으로 내세우는 &ldquo;지역 평균 대비 비율&rdquo;만이 실측 데이터에 직접 근거한 숫자입니다.
        </p>
      </LegalSection>

      <LegalSection heading="지도 데이터">
        <p>
          시/도 경계 지도는{" "}
          <a
            href="https://github.com/southkorea/southkorea-maps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#34D399] hover:underline"
          >
            southkorea/southkorea-maps
          </a>{" "}
          프로젝트가 통계청 통계지리정보서비스(SGIS) 원자료를 공공누리 제1유형 라이선스로 가공해 공개한 데이터를 사용합니다.
        </p>
      </LegalSection>

      <LegalSection heading="작동 방식">
        <p>모든 계산은 사용자의 브라우저 안에서만 이뤄집니다. 입력한 소득은 서버로 전송되지 않습니다.</p>
      </LegalSection>

      <LegalSection heading="재무 자문이 아닙니다">
        <p>이 사이트는 정보 제공 및 재미를 위한 용도로만 제공됩니다. 재무·세무 자문에 해당하지 않습니다.</p>
      </LegalSection>
    </LegalPage>
  );
}
