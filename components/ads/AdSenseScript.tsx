"use client";
// Site-wide AdSense loader — mount once in app/layout.tsx. Loads on every
// page except /result (a visitor's own income data; noindex, no ads).
//
// Client component only for usePathname — it reads the route without
// making the root layout dynamically rendered.
import Script from "next/script";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT_ID } from "@/lib/ads";

export default function AdSenseScript() {
  const pathname = usePathname();
  if (pathname === "/result" || pathname?.startsWith("/result/")) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
