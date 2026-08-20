import type { Metadata, Viewport } from "next";
import "./globals.css";
import { translations } from "@/lib/i18n";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import RootBody from "@/components/RootBody";
import AdSenseScript from "@/components/ads/AdSenseScript";

// Default/fallback metadata only — every real route sets its own metadata
// via generateMetadata, building canonical/og:url/og:image/twitter:image
// explicitly through lib/site-url.ts. metadataBase here is just a backstop
// for any metadata field that isn't already absolute.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: translations.ko.krAppTitle,
  description: translations.ko.krTagline,
  openGraph: {
    title: translations.ko.krAppTitle,
    description: translations.ko.krTagline,
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <RootBody>{children}</RootBody>
      <AdSenseScript />
    </html>
  );
}
