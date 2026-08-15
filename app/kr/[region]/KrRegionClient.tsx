"use client";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageProvider";
import { formatTemplate } from "@/lib/i18n";
import KrShell from "@/components/kr/KrShell";
import KrGeoList from "@/components/kr/KrGeoList";
import KrResultCard from "@/components/kr/KrResultCard";
import { readKrInputFromSearch } from "@/components/kr/KrInputPanel";
import Footer from "@/components/us/Footer";
import Spinner from "@/components/Spinner";
import type { SidoMeta, GuMeta } from "@/data/kr/regionMeta";
import type { KrRegionIncome } from "@/lib/krIncomeCalc";
import { formatManwon } from "@/lib/krFormat";

function KrRegionContent({
  sido,
  income,
  availableGus,
  pendingGus,
}: {
  sido: SidoMeta;
  income: KrRegionIncome;
  availableGus: { meta: GuMeta; income: KrRegionIncome }[];
  pendingGus: GuMeta[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const sp = useSearchParams();
  const qs = sp.toString();
  const input = readKrInputFromSearch(sp);

  const guItems = useMemo(
    () => [
      ...availableGus.map((g) => ({ id: g.meta.slug, name: g.meta.name, sub: formatManwon(g.income.mean) })),
      ...pendingGus.map((g) => ({ id: g.slug, name: g.name, sub: t.krPendingBadge, disabled: true })),
    ],
    [availableGus, pendingGus, t.krPendingBadge]
  );

  function resultHref(guSlug?: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("region", sido.slug);
    params.set("d", String(input.annualIncome));
    if (guSlug) params.set("gu", guSlug);
    else params.delete("gu");
    return `/kr/result?${params.toString()}`;
  }

  function handleSelectGu(guSlug: string) {
    router.push(resultHref(guSlug));
  }

  return (
    <KrShell>
      <KrResultCard presetSidoSlug={sido.slug} presetGuSlug={null} />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <Link href={qs ? `/kr?${qs}` : "/kr"} className="mb-6 inline-flex items-center gap-1 text-[13px] text-white/50 transition-colors hover:text-white/80">
          <ChevronLeft className="h-4 w-4" />
          {t.krBackToKrMap}
        </Link>

        <h1 className="mb-2 text-[26px] font-extrabold tracking-tight text-balance">
          {formatTemplate(t.krRegionMapTitleTemplate, { region: sido.name })}
        </h1>
        <p className="mb-6 max-w-xl text-[15px] text-white/55">{t.krRegionMapHint}</p>

        <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="mb-1 text-[12px] text-white/45">{t.krMeanLabel}</p>
          <p className="text-[20px] font-bold tabular-nums text-white">{formatManwon(income.mean)}</p>
        </div>

        <Link
          href={resultHref()}
          className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-[#34D399] px-5 py-2.5 text-[14px] font-bold text-[#04120C] transition-opacity hover:opacity-90"
        >
          {formatTemplate(t.krSeeRegionResultButtonTemplate, { region: sido.name })}
        </Link>

        {guItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/50">
            <p className="mb-1 font-semibold text-white/70">{t.krNoGuDataTitle}</p>
            <p className="text-[13px] text-white/45">{t.krNoGuDataDesc}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-2 text-[13px] font-bold text-white/90">
              {formatTemplate(t.krRegionMapTitleTemplate, { region: sido.name })}
            </p>
            <KrGeoList
              items={guItems}
              onSelect={handleSelectGu}
              searchPlaceholder={t.krSearchGuPlaceholder}
              emptyText={t.krListNoResults}
              maxHeight={420}
            />
          </div>
        )}

        <div className="mt-8 rounded-lg bg-white/[0.03] px-4 py-3 text-center">
          <p className="text-[12px] text-white/30">{t.krDisclaimer}</p>
        </div>

        <Footer />
      </div>
    </KrShell>
  );
}

export default function KrRegionClient(props: {
  sido: SidoMeta;
  income: KrRegionIncome;
  availableGus: { meta: GuMeta; income: KrRegionIncome }[];
  pendingGus: GuMeta[];
}) {
  return (
    <Suspense
      fallback={
        <KrShell>
          <div className="flex min-h-screen items-center justify-center">
            <Spinner className="h-8 w-8 border-[3px] border-white/20 border-t-[#34D399]" />
          </div>
        </KrShell>
      }
    >
      <KrRegionContent {...props} />
    </Suspense>
  );
}
