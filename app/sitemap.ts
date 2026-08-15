import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { KR_SIDO } from "@/data/kr/regionMeta";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  entries.push({ url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 });
  for (const path of ["about", "privacy", "contact"]) {
    entries.push({ url: absoluteUrl(`/${path}`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
  }
  for (const sido of KR_SIDO) {
    if (!sido.available) continue;
    entries.push({ url: absoluteUrl(`/${sido.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  return entries;
}
