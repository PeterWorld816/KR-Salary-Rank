import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KR_SIDO, getSidoBySlug } from "@/data/kr/regionMeta";
import { getAvailableGusForSido, getPendingGusForSido, getRegionIncomeByName } from "@/lib/krIncomeCalc";
import { getKrGuGeoForSido } from "@/lib/krGeo";
import { formatManwon } from "@/lib/krFormat";
import { formatTemplate, translations } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site-url";
import KrRegionClient from "./KrRegionClient";

// Prerenders only the 시/도 that actually have a real regionIncome.json row
// — a slug for a "준비중" province (e.g. /busan) isn't a real page yet, so
// it falls through to notFound() below instead of being statically built.
export function generateStaticParams() {
  return KR_SIDO.filter((s) => s.available).map((s) => ({ region: s.slug }));
}

type Params = { region: string };

export function generateMetadata({ params }: { params: Params }): Metadata {
  const sido = getSidoBySlug(params.region);
  const t = translations.ko;
  if (!sido || !sido.available) {
    return { title: t.krAppTitle, description: t.krTagline };
  }
  const income = getRegionIncomeByName(sido.name);
  const title = `${sido.name} — ${t.krAppTitle}`;
  const description = income
    ? formatTemplate(t.krSeeRegionResultButtonTemplate, { region: sido.name }) + ` (${formatManwon(income.mean)})`
    : t.krTagline;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/${sido.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${sido.slug}`),
      locale: "ko_KR",
      type: "website",
      images: [{ url: absoluteUrl("/og-kr.png"), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/og-kr.png")],
    },
  };
}

export default function KrRegionPage({ params }: { params: Params }) {
  const sido = getSidoBySlug(params.region);
  if (!sido || !sido.available) notFound();

  const income = getRegionIncomeByName(sido.name)!;
  const availableGus = getAvailableGusForSido(sido.slug);
  const pendingGus = getPendingGusForSido(sido.slug);
  // Only worth shipping the gu-level polygons when this 시도 actually has at
  // least one named 구/시 to show (available or pending) — most 시도 have no
  // KR_GU rows at all yet (see regionMeta.ts's meta.note) and would just get
  // an inert, unclickable map.
  const guGeo = availableGus.length + pendingGus.length > 0 ? getKrGuGeoForSido(sido.code) : null;

  return <KrRegionClient sido={sido} income={income} availableGus={availableGus} pendingGus={pendingGus} guGeo={guGeo} />;
}
