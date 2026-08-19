import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import KrShell from "./kr/KrShell";
import Footer from "./Footer";

export function LegalPage({
  title,
  backLabel,
  backHref,
  children,
}: {
  title: string;
  backLabel: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <KrShell>
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-caption text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <h1 className="mb-8 text-display text-balance">{title}</h1>

        <div className="space-y-8 text-body text-text-secondary">{children}</div>

        <Footer />
      </div>
    </KrShell>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-title text-text">{heading}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
