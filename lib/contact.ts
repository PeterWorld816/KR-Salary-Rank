// Single source of truth for the site's contact address — shared by
// app/contact/page.tsx and any mailto: CTA (e.g. the "이 지역 데이터 요청하기"
// link in app/[region]/KrRegionClient.tsx) so they can't drift apart.
export const CONTACT_EMAIL = "rmfrmfyoutube@gmail.com";

export function buildMailto(subject: string, body: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
