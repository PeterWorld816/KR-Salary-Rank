import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site-url";
import Footer from "@/components/Footer";
import { KR_INSIGHTS } from "./articles";

export const metadata: Metadata = {
  title: "소득 통계 읽을거리 — 내 소득 상위 몇 %?",
  description: "공개 소득 통계와 계산 방법을 맥락과 함께 설명하는 한국어 읽을거리입니다.",
  alternates: { canonical: absoluteUrl("/insights") },
};

export default function InsightsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:px-8">
      <Link href="/" className="text-caption font-semibold text-accent hover:underline">홈으로</Link>
      <header className="mb-8 mt-6">
        <h1 className="text-display font-bold text-text">소득 통계 읽을거리</h1>
        <p className="mt-3 text-body leading-relaxed text-text-secondary">
          지역별 평균 숫자만 나열하지 않고, 자료가 말해주는 것과 말해주지 않는 것을 함께 살펴봅니다.
        </p>
      </header>
      <ul className="space-y-4">
        {KR_INSIGHTS.map((article) => (
          <li key={article.slug} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-title font-bold text-text">
              <Link href={`/insights/${article.slug}`} className="hover:text-accent">{article.title}</Link>
            </h2>
            <p className="mt-2 text-body leading-relaxed text-text-secondary">{article.description}</p>
            <Link
              href={`/insights/${article.slug}`}
              className="mt-4 inline-flex text-caption font-semibold text-accent hover:underline"
            >
              읽어보기 →
            </Link>
          </li>
        ))}
      </ul>
      <Footer />
    </main>
  );
}
