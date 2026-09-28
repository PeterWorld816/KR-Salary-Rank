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
            <span className="font-semibold text-text-secondary">국세청 국세통계 4.2.15 — 시군구별 근로소득 연말정산 신고현황 (2023년 귀속)</span>
            <br />
            <span className="text-text-tertiary">
              <a
                href="https://kosis.kr/statHtml/statHtml.do?tblId=DT_133001N_4215&orgId=133"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                tblId DT_133001N_4215, orgId 133 (KOSIS)
              </a>
              . 주소지 기준 급여총계 금액을 신고 인원으로 나눠 1인당 연평균을 계산했습니다.
            </span>
          </li>
          <li>
            <span className="font-semibold text-text-secondary">대구·경북 일부 구/군의 2024년 귀속 자료</span>
            <br />
            <a
              href="https://www.kyongbuk.co.kr/news/articleView.html?idxno=4080807"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              경북일보의 TASIS 국세통계 인용 기사 (대구 3개 구·경북 20개 시군)
            </a>
          </li>
        </ul>
        <p className="text-text-tertiary">
          기준 시점: {krRegionIncomeMeta.asOf}. 읍·면·동 평균은 해당 통계표에 공개되어 있지 않아 제공하지 않습니다.
          고양·성남·수원·안산·안양·용인·청주·천안·전주·포항·창원은 구별 값이 아닌 시 전체 값만 공개되어 있어, 목록에는 시 평균으로 표시하고 구별 지도 경계에 복제하지 않습니다.
          세종은 단일 시 경계와 시/도 경계가 같아 시/도 평균을 시 전체 값으로도 표시합니다.
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
            className="text-accent hover:underline"
          >
            southkorea/southkorea-maps
          </a>{" "}
          프로젝트가 통계청 통계지리정보서비스(SGIS) 원자료를 공공누리 제1유형 라이선스로 가공해 공개한 데이터를 사용합니다.
          시군구 경계는 2018년판이며, 통계의 최신 행정구역 소속(예: 대구 군위군)은 지역 메타데이터로 따로 반영합니다.
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
