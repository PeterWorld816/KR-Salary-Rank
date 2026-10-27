import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site-url";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 내 소득 상위 몇 %?",
  description: "이 사이트의 Google AdSense 광고와 쿠키, 맞춤 광고 끄는 방법, 입력값 처리 방식을 안내합니다.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

const EFFECTIVE_DATE = "2026년 10월 27일";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
      {children}
    </a>
  );
}

export default function KrPrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침" backLabel="홈으로" backHref="/">
      <p className="text-caption text-text-tertiary">시행일: {EFFECTIVE_DATE}</p>

      <LegalSection heading="개요">
        <p>
          이 개인정보처리방침은 본 사이트(이하 “사이트”)가 어떤 정보를 어떻게 다루는지 설명합니다. 사이트는 회원가입이 없고,
          소득 비교 계산은 모두 이용자의 브라우저 안에서 이뤄집니다.
        </p>
      </LegalSection>

      <LegalSection heading="입력한 소득은 서버에 저장되지 않습니다">
        <p>
          입력한 연봉과 직업군은 지역 평균과 비교하는 계산에만 쓰이며, 사이트 운영자의 서버로 전송되거나 저장되지 않습니다.
          페이지를 옮겨 다녀도 값이 유지되도록 브라우저의 세션 저장소(sessionStorage)에만 보관하며, 이 값은 해당 브라우저 탭을
          닫으면 삭제됩니다.
        </p>
        <p>
          평소에는 주소창(URL)에 입력값이 나타나지 않습니다. 다만 결과 화면에서 ‘공유하기’나 ‘카카오톡 공유’를 눌러 만든 링크에는
          받는 사람이 같은 결과를 볼 수 있도록 연봉과 직업군이 포함됩니다. 이 링크를 열면 값을 화면에 불러온 뒤 주소창에서는
          곧바로 지웁니다. 공유 링크를 어디에 올릴지는 이용자가 판단해 주세요.
        </p>
      </LegalSection>

      <LegalSection heading="광고와 쿠키 (Google AdSense)">
        <p>
          이 사이트는 Google AdSense로 광고를 게재합니다. Google을 비롯한 제3자 광고 사업자는 쿠키를 사용해 이용자가 이 사이트와
          다른 웹사이트를 방문한 기록을 바탕으로 관심 기반 광고(맞춤 광고)를 보여줄 수 있습니다. Google은 광고 쿠키를 사용해
          이 사이트 및 인터넷의 다른 사이트 방문 정보를 기반으로 이용자에게 광고를 게재할 수 있습니다.
        </p>
        <p>
          쿠키는 웹사이트가 브라우저에 저장하는 작은 텍스트 파일입니다. Google이 광고에서 데이터를 사용하는 방식은{" "}
          <ExternalLink href="https://policies.google.com/technologies/ads">Google 광고 정책 안내</ExternalLink>에서 확인할 수
          있습니다. 개인의 소득 결과가 표시되는 결과 화면(/result)에는 광고 스크립트를 넣지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="맞춤 광고를 끄는 방법">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <ExternalLink href="https://adssettings.google.com">Google 광고 설정(https://adssettings.google.com)</ExternalLink>에
            접속해 ‘맞춤 광고’를 끄면 Google이 관심 기반 광고를 보여주지 않습니다. 끈 뒤에도 광고는 표시되지만, 방문 기록이 아닌
            페이지 내용 등 일반적인 정보를 기준으로 표시됩니다.
          </li>
          <li>
            Google 이외의 제3자 광고 사업자의 맞춤 광고용 쿠키는{" "}
            <ExternalLink href="https://www.aboutads.info/choices">www.aboutads.info/choices</ExternalLink>에서 거부할 수 있습니다.
          </li>
          <li>브라우저 설정에서 쿠키를 삭제하거나 제3자 쿠키를 차단할 수도 있습니다. 이 경우 일부 사이트 기능이 다르게 동작할 수 있습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="자동으로 수집될 수 있는 정보">
        <p>
          대부분의 웹사이트와 마찬가지로, 호스팅 제공업체(Netlify)는 서비스 운영과 보안을 위해 IP 주소, 브라우저 종류, 요청한
          페이지 주소 같은 접속 기록을 남길 수 있습니다. 사이트 운영자는 이 기록으로 이용자를 식별하지 않으며, 현재 별도의 방문
          분석 도구는 사용하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="아동 개인정보">
        <p>이 사이트는 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 고의로 수집하지 않습니다.</p>
      </LegalSection>

      <LegalSection heading="제3자 데이터와 링크">
        <p>
          사이트는 국세청 국세통계(KOSIS)의 공개 통계와, southkorea/southkorea-maps 프로젝트가 공공누리 제1유형으로 공개한 지도
          데이터를 사용합니다. 링크된 외부 사이트의 개인정보 처리에 대해서는 각 사이트의 방침을 따릅니다.
        </p>
      </LegalSection>

      <LegalSection heading="방침의 변경">
        <p>이 방침이 바뀌면 이 페이지에 변경 내용과 새 시행일을 게시합니다.</p>
      </LegalSection>

      <LegalSection heading="문의">
        <p>
          이 방침에 대해 궁금한 점은{" "}
          <Link href="/contact" className="text-accent hover:underline">
            문의 페이지
          </Link>
          를 이용해 주세요.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
