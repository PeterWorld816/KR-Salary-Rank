"use client";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { FeatureCollection, Geometry } from "geojson";
import { formatTemplate, translations } from "@/lib/i18n";
import KrShell from "@/components/kr/KrShell";
import KrMap, { type KrMapFeatureProps } from "@/components/kr/KrMap";
import KrGeoList from "@/components/kr/KrGeoList";
import KrIncomeLegend from "@/components/kr/KrIncomeLegend";
import KrResultCard from "@/components/kr/KrResultCard";
import { readKrInputFromSearch } from "@/components/kr/KrInputPanel";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import type { SidoMeta, GuMeta } from "@/data/kr/regionMeta";
import type { KrRegionIncome } from "@/lib/krIncomeCalc";
import { formatManwon } from "@/lib/krFormat";
import { incomeFill } from "@/components/colorScale";
import { buildMailto } from "@/lib/contact";

function KrRegionContent({
  sido,
  income,
  availableGus,
  pendingGus,
  guGeo,
}: {
  sido: SidoMeta;
  income: KrRegionIncome;
  availableGus: { meta: GuMeta; income: KrRegionIncome }[];
  pendingGus: GuMeta[];
  guGeo: FeatureCollection<Geometry, KrMapFeatureProps> | null;
}) {
  const t = translations.ko;
  const router = useRouter();
  const sp = useSearchParams();
  const qs = sp.toString();
  const input = readKrInputFromSearch(sp);

  const guItems = useMemo(
    () => [
      ...availableGus.map((g) => ({
        id: g.meta.slug,
        name: g.meta.name,
        sub: formatManwon(g.income.mean),
        badge: g.meta.aggregation === "city" ? "시 전체" : undefined,
      })),
      ...pendingGus.map((g) => ({ id: g.slug, name: g.name, sub: t.krPendingBadge, disabled: true })),
    ],
    [availableGus, pendingGus, t.krPendingBadge]
  );

  // Map polygons use their topology code to find statistics. A city-wide
  // KOSIS row has no one-to-one polygon, so it appears in the list only;
  // unmatched smaller polygons remain disabled instead of inheriting that
  // city-wide mean.
  const geoNameByCode = useMemo(() => new Map((guGeo?.features ?? []).map((f) => [String(f.id), f.properties.name])), [guGeo]);
  const guNameByCode = useMemo(() => {
    const map = new Map(geoNameByCode);
    for (const g of availableGus) if (g.meta.code) map.set(g.meta.code, g.meta.name);
    for (const g of pendingGus) if (g.code) map.set(g.code, g.name);
    return map;
  }, [geoNameByCode, availableGus, pendingGus]);
  const slugByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of availableGus) if (g.meta.code) map.set(g.meta.code, g.meta.slug);
    for (const g of pendingGus) if (g.code) map.set(g.code, g.slug);
    return map;
  }, [availableGus, pendingGus]);
  const meanByCode = useMemo(
    () => new Map(availableGus.flatMap((g) => g.meta.code ? [[g.meta.code, g.income.mean] as const] : [])),
    [availableGus]
  );
  const disabledCodeIds = useMemo(
    () => new Set((guGeo?.features ?? []).map((f) => String(f.id)).filter((code) => !meanByCode.has(code))),
    [guGeo, meanByCode]
  );

  const { min: guMin, max: guMax } = useMemo(() => {
    const values = [...meanByCode.values()];
    return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 1 };
  }, [meanByCode]);

  function resultHref(guSlug?: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("region", sido.slug);
    params.set("d", String(input.annualIncome));
    if (guSlug) params.set("gu", guSlug);
    else params.delete("gu");
    return `/result?${params.toString()}`;
  }

  function handleSelectGu(guSlug: string) {
    router.push(resultHref(guSlug));
  }

  function handleSelectGuCode(code: string) {
    const guSlug = slugByCode.get(code);
    if (guSlug) handleSelectGu(guSlug);
  }

  function getGuMapFill(code: string) {
    const mean = meanByCode.get(code);
    if (mean == null) return incomeFill(null, guMin, guMax);
    // incomeFill needs max > min to place a color on the gradient — with
    // only one available 구/시 (e.g. 경기 이천시 today), guMin === guMax and
    // it would otherwise fall back to the same "no data" fill as every
    // disabled neighbor, hiding the one region that actually has data.
    if (guMax <= guMin) return "var(--color-accent)";
    return incomeFill(mean, guMin, guMax);
  }

  function getGuMapLabel(code: string) {
    const name = guNameByCode.get(code) ?? code;
    if (disabledCodeIds.has(code)) return `${name} — ${t.krPendingBadge}`;
    const mean = meanByCode.get(code);
    return mean != null ? `${name} — ${formatManwon(mean)}` : name;
  }

  return (
    <KrShell>
      <KrResultCard presetSidoSlug={sido.slug} presetGuSlug={null} />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <Link href={qs ? `/?${qs}` : "/"} className="mb-6 inline-flex items-center gap-1 text-caption text-text-secondary transition-colors hover:text-text">
          <ChevronLeft className="h-4 w-4" />
          {t.krBackToKrMap}
        </Link>

        <h1 className="mb-2 text-display text-balance">
          {formatTemplate(t.krRegionMapTitleTemplate, { region: sido.name })}
        </h1>
        <p className="mb-6 max-w-xl text-body text-text-secondary">{t.krRegionMapHint}</p>

        <div className="mb-8 rounded-xl border border-border bg-surface px-5 py-4">
          <p className="mb-1 text-caption text-text-secondary">{t.krMeanLabel}</p>
          <p className="text-title tabular-nums text-text">{formatManwon(income.mean)}</p>
        </div>

        <Link
          href={resultHref()}
          className="touch-target mb-8 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 text-body font-bold text-on-accent transition-opacity hover:opacity-90"
        >
          {formatTemplate(t.krSeeRegionResultButtonTemplate, { region: sido.name })}
        </Link>

        {guItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-text-secondary">
            <p className="mb-1 font-semibold text-text">{t.krNoGuDataTitle}</p>
            <p className="mb-4 text-caption text-text-secondary">{t.krNoGuDataDesc}</p>
            <a
              href={buildMailto(
                formatTemplate(t.krRequestDataMailSubjectTemplate, { region: sido.name }),
                formatTemplate(t.krRequestDataMailBodyTemplate, { region: sido.name })
              )}
              className="btn btn-secondary"
            >
              {t.krRequestDataCta}
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-2 text-caption font-bold text-text">
              {formatTemplate(t.krRegionMapTitleTemplate, { region: sido.name })}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {guGeo && (
                <div className="min-w-0 flex-1">
                  <KrMap
                    geo={guGeo}
                    onSelect={handleSelectGuCode}
                    getFill={getGuMapFill}
                    getLabel={getGuMapLabel}
                    disabledIds={disabledCodeIds}
                    height={480}
                  />
                </div>
              )}
              <div className={guGeo ? "w-full shrink-0 sm:w-64" : undefined}>
                <KrGeoList
                  items={guItems}
                  onSelect={handleSelectGu}
                  searchPlaceholder={t.krSearchGuPlaceholder}
                  emptyText={t.krListNoResults}
                  maxHeight={420}
                />
              </div>
            </div>
            {guGeo && <KrIncomeLegend min={guMin} max={guMax} />}
          </div>
        )}

        <div className="mt-8 rounded-lg bg-surface px-4 py-3 text-center">
          <p className="text-caption text-text-tertiary">{t.krDisclaimer}</p>
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
  guGeo: FeatureCollection<Geometry, KrMapFeatureProps> | null;
}) {
  return (
    <Suspense
      fallback={
        <KrShell>
          <div className="flex min-h-screen items-center justify-center">
            <Spinner className="h-8 w-8 border-[3px] border-border-strong border-t-accent" />
          </div>
        </KrShell>
      }
    >
      <KrRegionContent {...props} />
    </Suspense>
  );
}
