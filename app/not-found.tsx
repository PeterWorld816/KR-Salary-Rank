import { LegalPage } from "@/components/LegalPage";

// Site-styled 404 so the footer links (인사이트·소개·개인정보처리방침·문의)
// appear on every page, including missing ones.
export default function NotFound() {
  return (
    <LegalPage title="페이지를 찾을 수 없어요" backLabel="홈으로" backHref="/">
      <p>주소가 바뀌었거나 없는 페이지예요. 홈에서 지도로 지역을 골라 다시 시작해 보세요.</p>
    </LegalPage>
  );
}
