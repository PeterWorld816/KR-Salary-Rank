import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import regionIncomeData from "@/data/kr/regionIncome.json";
import Footer from "@/components/Footer";
import { absoluteUrl } from "@/lib/site-url";
import { KR_INSIGHTS } from "../articles";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return KR_INSIGHTS.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const article = KR_INSIGHTS.find(({ slug }) => slug === params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — 내 소득 상위 몇 %?`,
    description: article.description,
    alternates: { canonical: absoluteUrl(`/insights/${article.slug}`) },
    openGraph: { title: article.title, description: article.description, url: absoluteUrl(`/insights/${article.slug}`), locale: "ko_KR", type: "article" },
  };
}

export default function InsightArticlePage({ params }: { params: Params }) {
  const article = KR_INSIGHTS.find(({ slug }) => slug === params.slug);
  if (!article) notFound();

  const provinceRows = regionIncomeData.regions
    .filter((region) => region.level === "sido")
    .sort((a, b) => b.mean - a.mean);
  const seoulRows = regionIncomeData.regions
    .filter((region) => region.level === "gu" && region.parent === "서울특별시")
    .sort((a, b) => b.mean - a.mean);
  const nationalMean = regionIncomeData.regions.find((region) => region.level === "national")?.mean;
  const showProvinceTable = article.slug === "2023-sido-average-income";
  const showSeoulTable = article.slug === "seoul-district-income-gap";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:px-8">
      <Link href="/insights" className="text-caption font-semibold text-accent hover:underline">읽을거리 목록</Link>
      <article className="mt-6">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-display font-bold leading-tight text-text">{article.title}</h1>
          <p className="mt-4 text-body leading-relaxed text-text-secondary">{article.description}</p>
        </header>

        {showProvinceTable && (
          <div className="mb-8 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[320px] text-left text-caption">
              <caption className="sr-only">2023년 귀속 시·도별 근로소득 평균 연봉 순위, 단위 만원</caption>
              <thead className="bg-bg-subtle text-text-secondary">
                <tr><th className="px-4 py-3">순위</th><th className="px-4 py-3">시·도</th><th className="px-4 py-3 text-right">평균 연봉</th></tr>
              </thead>
              <tbody>
                {provinceRows.map((region, index) => (
                  <tr key={region.name} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums text-text-tertiary">{index + 1}</td>
                    <th scope="row" className="px-4 py-3 font-medium text-text">{region.name}</th>
                    <td className="px-4 py-3 text-right tabular-nums text-text">{region.mean.toLocaleString("ko-KR")}만원</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-caption text-text-tertiary">
              출처: 국세청·KOSIS 근로소득 연말정산 신고 통계. 전국 평균
              {nationalMean == null ? "" : ` ${nationalMean.toLocaleString("ko-KR")}만원`}은 시·도 순위에서 제외했습니다.
            </p>
          </div>
        )}

        {showSeoulTable && (
          <div className="mb-8 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[320px] text-left text-caption">
              <caption className="sr-only">서울 25개 자치구별 근로소득 평균 연봉, 단위 만원</caption>
              <thead className="bg-bg-subtle text-text-secondary">
                <tr><th className="px-4 py-3">순위</th><th className="px-4 py-3">자치구</th><th className="px-4 py-3 text-right">평균 연봉</th></tr>
              </thead>
              <tbody>
                {seoulRows.map((region, index) => (
                  <tr key={region.name} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums text-text-tertiary">{index + 1}</td>
                    <th scope="row" className="px-4 py-3 font-medium text-text">{region.name}</th>
                    <td className="px-4 py-3 text-right tabular-nums text-text">{region.mean.toLocaleString("ko-KR")}만원</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-caption text-text-tertiary">서울 25개 자치구 자료. 출처: 국세청 국세통계 4.2.15, 2023년 귀속. 단위 만원.</p>
          </div>
        )}

        {showProvinceTable && provinceRows.length > 0 && nationalMean != null && (
          <p className="mb-8 text-body leading-8 text-text-secondary">
            2023년 귀속 자료에서 평균이 가장 높은 시·도는 {provinceRows[0].name}({provinceRows[0].mean.toLocaleString("ko-KR")}만원),
            가장 낮은 곳은 {provinceRows[provinceRows.length - 1].name}({provinceRows[provinceRows.length - 1].mean.toLocaleString("ko-KR")}만원)입니다.
            전국 평균은 {nationalMean.toLocaleString("ko-KR")}만원입니다. 이 값은 페이지의 원자료를 기준으로 표시하며, 귀속연도가 다른 세부지역 값과 섞어 순위를 매기지 않았습니다.
          </p>
        )}

        {showSeoulTable && seoulRows.length > 0 && (
          <p className="mb-8 text-body leading-8 text-text-secondary">
            서울에서 가장 높은 평균은 {seoulRows[0].name}({seoulRows[0].mean.toLocaleString("ko-KR")}만원),
            가장 낮은 평균은 {seoulRows[seoulRows.length - 1].name}({seoulRows[seoulRows.length - 1].mean.toLocaleString("ko-KR")}만원)입니다.
            두 값은 같은 KOSIS 표의 주소지 기준 자료에서 계산했습니다.
          </p>
        )}

        <div className="space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-title font-bold text-text">{section.heading}</h2>
              <div className="space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-body leading-8 text-text-secondary">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-10 rounded-xl bg-bg-subtle p-5 text-caption leading-relaxed text-text-tertiary">
          자료 기준일: {regionIncomeData.meta.asOf} 자세한 자료 출처와 추정치의 한계는{" "}
          <Link href="/about" className="font-semibold text-accent hover:underline">사이트 소개</Link>에서 확인할 수 있습니다.
        </aside>
      </article>
      <Footer />
    </main>
  );
}
