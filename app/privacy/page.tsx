import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 내 소득 상위 몇 %?",
  description: "이 사이트의 쿠키, 로컬 저장소, 광고, 애널리틱스 처리 방식을 안내합니다.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "개요",
    body: [
      "이 개인정보처리방침은 본 사이트(이하 “사이트”)가 수집하는 정보와 그 사용 방식을 설명합니다. 이 사이트는 사용자의 브라우저 안에서만 동작하도록 만들어졌습니다 — 입력한 소득은 지역 평균과의 비교 계산에만 사용되며, 저희 서버로 전송되거나 저장되지 않습니다.",
    ],
  },
  {
    heading: "수집하는 정보",
    body: [
      "이 사이트는 별도의 회원가입을 요구하지 않으며, 계산기를 통해 이름·이메일·금융계좌 정보를 수집하지 않습니다.",
      "입력하신 소득 값은 브라우저 안에만 남아있고, 결과 링크를 직접 공유하지 않는 한 URL 밖으로 나가지 않습니다.",
      "대부분의 웹사이트와 마찬가지로, 호스팅 제공업체 및 애널리틱스 서비스가 IP 주소, 브라우저 종류, 기기 종류, 방문한 페이지 등 일반적인 기술 정보를 자동으로 수집할 수 있습니다.",
    ],
  },
  {
    heading: "쿠키 및 로컬 저장소",
    body: [
      "이 사이트는 브라우저의 로컬 저장소(localStorage)를 사용해 언어 설정(한국어/영어) 한 가지만 기억합니다. 이 정보는 사용자의 기기에만 저장되며 저희에게 전송되지 않습니다.",
    ],
  },
  {
    heading: "애널리틱스",
    body: [
      "저희는 방문자가 사이트를 어떻게 이용하는지 파악하기 위해 애널리틱스 서비스를 사용할 수 있습니다. 이렇게 수집된 데이터는 집계된 형태로만 사용되며, 브라우저를 벗어나지 않는 계산기 입력값과는 연결되지 않습니다.",
    ],
  },
  {
    heading: "아동 개인정보",
    body: ["이 사이트는 만 13세 미만 아동을 대상으로 하지 않으며, 만 13세 미만 아동의 개인정보를 고의로 수집하지 않습니다."],
  },
  {
    heading: "제3자 링크 및 데이터",
    body: [
      "이 사이트는 국세청(국가통계포털 KOSIS)의 공개 통계와, southkorea/southkorea-maps 프로젝트가 공공누리 제1유형 라이선스로 공개한 지도 데이터를 사용합니다. 링크된 사이트의 개인정보 처리방침에 대해서는 저희가 책임지지 않습니다.",
    ],
  },
  {
    heading: "방침 변경",
    body: ["이 개인정보처리방침은 수시로 변경될 수 있으며, 변경 사항은 이 페이지에 게시되는 즉시 효력이 발생합니다."],
  },
  {
    heading: "문의하기",
    body: ["이 방침에 대해 궁금한 점이 있으시면 문의 페이지를 방문해주세요."],
  },
];

export default function KrPrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침" backLabel="홈으로" backHref="/">
      <p className="text-[12px] text-white/35">최종 수정일: 2026년 8월</p>
      {SECTIONS.map((s) => (
        <LegalSection key={s.heading} heading={s.heading}>
          {s.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </LegalSection>
      ))}
    </LegalPage>
  );
}
