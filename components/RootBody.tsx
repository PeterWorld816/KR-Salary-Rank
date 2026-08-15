"use client";
import { LanguageProvider } from "@/lib/LanguageProvider";

export default function RootBody({ children }: { children: React.ReactNode }) {
  return (
    <body>
      <LanguageProvider initialLang="ko">{children}</LanguageProvider>
    </body>
  );
}
