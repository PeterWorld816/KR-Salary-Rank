"use client";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FeatureCollection, Geometry } from "geojson";
import { formatTemplate, translations } from "@/lib/i18n";
import KrShell from "@/components/kr/KrShell";
import KrMap, { type KrMapFeatureProps } from "@/components/kr/KrMap";
import KrGeoList from "@/components/kr/KrGeoList";
import KrIncomeLegend from "@/components/kr/KrIncomeLegend";
import KrResultCard from "@/components/kr/KrResultCard";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { KR_SIDO } from "@/data/kr/regionMeta";
import { getRegionIncomeByName, getAvailableGusForSido, krRegionIncomeMeta } from "@/lib/krIncomeCalc";
import { incomeFill } from "@/components/colorScale";
import { formatManwon } from "@/lib/krFormat";

function KrHomeContent({ geo }: { geo: FeatureCollection<Geometry, KrMapFeatureProps> }) {
  const t = translations.ko;
  const router = useRouter();
  const sp = useSearchParams();
  const qs = sp.toString();

  const meanByCode = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const sido of KR_SIDO) {
      map.set(sido.code, sido.available ? getRegionIncomeByName(sido.name)?.mean ?? null : null);
    }
    return map;
  }, []);

  const { min, max } = useMemo(() => {
    const values = [...meanByCode.values()].filter((v): v is number => v != null);
    return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 1 };
  }, [meanByCode]);

  const disabledIds = useMemo(() => new Set(KR_SIDO.filter((s) => !s.available).map((s) => s.code)), []);

  // 시/도 that have at least one 구/시 with a real income row — visiting these
  // gets a clickable gu-level map instead of just the "시군구 세부 데이터가
  // 아직 없어요" placeholder (see app/[region]/page.tsx). Surfaced up front
  // (map hover label + list badge) so visitors aren't surprised after they
  // click in — see README's "데이터 추가 가이드" for how this set grows.
  const guDetailCodes = useMemo(
    () => new Set(KR_SIDO.filter((s) => s.available && getAvailableGusForSido(s.slug).length > 0).map((s) => s.code)),
    []
  );

  function getHref(code: string) {
    const sido = KR_SIDO.find((s) => s.code === code);
    if (!sido || !sido.available) return "/";
    return qs ? `/${sido.slug}?${qs}` : `/${sido.slug}`;
  }

  function getLabel(code: string) {
    const sido = KR_SIDO.find((s) => s.code === code);
    if (!sido) return "";
    if (!sido.available) return `${sido.name} — ${t.krPendingBadge}`;
    const mean = meanByCode.get(code);
    const base = mean != null ? `${sido.name} — ${formatManwon(mean)}` : sido.name;
    return guDetailCodes.has(code) ? `${base} · ${t.krGuDetailAvailableBadge}` : base;
  }

  function getFill(code: string) {
    return incomeFill(meanByCode.get(code) ?? null, min, max);
  }

  function handleSelect(code: string) {
    const sido = KR_SIDO.find((s) => s.code === code);
    if (!sido || !sido.available) return;
    router.push(getHref(code));
  }

  const sidoItems = KR_SIDO.map((s) => ({
    id: s.code,
    name: s.name,
    sub: s.available ? (meanByCode.get(s.code) != null ? formatManwon(meanByCode.get(s.code)!) : undefined) : t.krPendingBadge,
    disabled: !s.available,
    badge: guDetailCodes.has(s.code) ? t.krGuDetailAvailableBadge : undefined,
  }));

  return (
    <KrShell>
      <KrResultCard presetSidoSlug={null} presetGuSlug={null} />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="mb-2 text-display text-balance">{t.krAppTitle}</h1>
        <p className="mb-2 max-w-xl text-body text-text-secondary">{t.krTagline}</p>
        <p className="mb-8 text-caption font-semibold text-text-tertiary">{t.krOnboardingStepsLine}</p>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-title text-text">{t.krMapTitle}</h2>
          <span className="text-caption text-text-tertiary">{t.krMapHint}</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-2 sm:p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <KrMap geo={geo} onSelect={handleSelect} getFill={getFill} getLabel={getLabel} disabledIds={disabledIds} height={520} />
            </div>

            <div className="w-full shrink-0 sm:w-64">
              <KrGeoList
                items={sidoItems}
                onSelect={handleSelect}
                searchPlaceholder={t.krSearchSidoPlaceholder}
                emptyText={t.krListNoResults}
                maxHeight={480}
              />
            </div>
          </div>
          <KrIncomeLegend min={min} max={max} />
        </div>

        <div className="mt-2 rounded-lg bg-surface px-4 py-3 text-center">
          <p className="text-caption text-text-tertiary">{formatTemplate(t.krSourceLabelTemplate, { asOf: krRegionIncomeMeta.asOf })}</p>
          <p className="mt-1 text-caption text-text-tertiary">{t.krDisclaimer}</p>
          <p className="mt-1 text-caption text-text-tertiary">🔒 {t.privacyNotice}</p>
        </div>

        <Footer />
      </div>
    </KrShell>
  );
}

export default function KrHomeClient({ geo }: { geo: FeatureCollection<Geometry, KrMapFeatureProps> }) {
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
      <KrHomeContent geo={geo} />
    </Suspense>
  );
}
