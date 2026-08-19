"use client";
import Link from "next/link";
import { translations } from "@/lib/i18n";

export default function Footer() {
  const t = translations.ko;

  const links = [
    { href: "/about", label: t.footerAbout },
    { href: "/privacy", label: t.footerPrivacy },
    { href: "/contact", label: t.footerContact },
  ];

  return (
    <footer className="mt-10 border-t border-border pt-6">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-caption text-text-tertiary transition-colors hover:text-text-secondary"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
