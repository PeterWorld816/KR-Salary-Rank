import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

// /result carries the visitor's own income in the query string (?d=&region=&gu=),
// so the combination space is unbounded — disallowing keeps crawl budget on
// pages that are actually worth indexing (home, region pages, etc).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/result"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
