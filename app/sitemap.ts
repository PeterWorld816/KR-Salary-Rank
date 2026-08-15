import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { getAllInsights } from "@/lib/insights";
import { US_STATES } from "@/data/us/stateMeta";
import { getCountiesForState } from "@/lib/usCountyPlaceData";
import { KR_SIDO } from "@/data/kr/regionMeta";

// /us is the ACS/Census-backed section (app/[locale]/**); /kr is now its own
// real section backed by Korean KOSIS/국세청 data (app/kr/**, see
// data/kr/regionIncome.json) — genuinely different content, not a mirror, so
// it's listed and allowed to rank on its own (app/robots.ts only disallows
// /kr/result, same reasoning as /us/result below).
const LOCALE_BASES = ["/us"] as const;
const INSIGHT_LANGS = { "/us": "en" } as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  entries.push({ url: absoluteUrl("/kr"), lastModified: now, changeFrequency: "weekly", priority: 1 });
  for (const path of ["about", "privacy", "contact"]) {
    entries.push({ url: absoluteUrl(`/kr/${path}`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
  }
  for (const sido of KR_SIDO) {
    if (!sido.available) continue;
    entries.push({ url: absoluteUrl(`/kr/${sido.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  for (const base of LOCALE_BASES) {
    entries.push({
      url: absoluteUrl(base),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    });

    for (const path of ["about", "privacy", "contact", "insights"]) {
      entries.push({
        url: absoluteUrl(`${base}/${path}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const article of getAllInsights(INSIGHT_LANGS[base])) {
      entries.push({
        url: absoluteUrl(`${base}/insights/${article.slug}`),
        lastModified: new Date(article.date),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const state of US_STATES) {
      entries.push({
        url: absoluteUrl(`${base}/${state.abbr}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });

      // Now real per-county content pages (see app/us/[state]/[county]/page.tsx),
      // not the redirect they used to be — worth listing so they get crawled
      // rather than discovered only by following links from the state page.
      for (const county of getCountiesForState(state.fips)) {
        entries.push({
          url: absoluteUrl(`${base}/${state.abbr}/${county.fips}`),
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  return entries;
}
