import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { LegalPage, LegalSection } from "@/components/LegalPage";

const CONTACT_EMAIL = "rmfrmfyoutube@gmail.com";

export const metadata: Metadata = {
  title: "문의하기 — 내 소득 상위 몇 %?",
  description: "질문, 피드백, 데이터 오류 제보는 이메일로 보내주세요.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function KrContactPage() {
  return (
    <LegalPage title="문의하기" backLabel="홈으로" backHref="/">
      <LegalSection heading="문의 방법">
        <p>계산 방식이 궁금하시거나, 사이트에 대한 의견, 데이터 오류 제보가 있으시면 아래 이메일로 연락해주세요:</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-block text-[15px] font-semibold text-[#34D399] hover:underline">
          {CONTACT_EMAIL}
        </a>
      </LegalSection>
    </LegalPage>
  );
}
