import type { Metadata } from "next";
import { getKrSidoGeo } from "@/lib/krGeo";
import { absoluteUrl } from "@/lib/site-url";
import { translations } from "@/lib/i18n";
import KrHomeClient from "./KrHomeClient";

export const metadata: Metadata = {
  title: translations.ko.krAppTitle,
  description: translations.ko.krTagline,
  alternates: { canonical: absoluteUrl("/kr") },
  openGraph: {
    title: translations.ko.krAppTitle,
    description: translations.ko.krTagline,
    url: absoluteUrl("/kr"),
    locale: "ko_KR",
    type: "website",
  },
};

export default function KrPage() {
  const geo = getKrSidoGeo();
  return <KrHomeClient geo={geo} />;
}
