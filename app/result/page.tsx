import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { translations } from "@/lib/i18n";
import KrResultDashboard from "@/components/kr/KrResultDashboard";

export const metadata: Metadata = {
  title: `${translations.ko.krDashboardIncomeSectionTitle} — ${translations.ko.krAppTitle}`,
  description: translations.ko.krResultDashboardIntro,
  // Carries a visitor's own income + region choice, so it should never rank
  // for generic searches the way / and /[region] can.
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/result") },
};

export default function KrResultPage() {
  return <KrResultDashboard />;
}
