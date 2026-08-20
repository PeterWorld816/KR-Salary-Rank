import type { Metadata } from "next";
import { getKrSidoGeo } from "@/lib/krGeo";
import { absoluteUrl } from "@/lib/site-url";
import { translations } from "@/lib/i18n";
import KrHomeClient from "./KrHomeClient";

export const metadata: Metadata = {
  title: translations.ko.krAppTitle,
  description: translations.ko.krTagline,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: translations.ko.krAppTitle,
    description: translations.ko.krTagline,
    url: absoluteUrl("/"),
    locale: "ko_KR",
    type: "website",
    images: [{ url: absoluteUrl("/og-kr.png"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: translations.ko.krAppTitle,
    description: translations.ko.krTagline,
    images: [absoluteUrl("/og-kr.png")],
  },
};

export default function KrPage() {
  const geo = getKrSidoGeo();
  return <KrHomeClient geo={geo} />;
}
