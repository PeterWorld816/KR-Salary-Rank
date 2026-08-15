import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

// /kr is now a real, independent section backed by actual Korean KOSIS/국세청
// data (see data/kr/regionIncome.json) rather than a Korean-UI mirror of /us
// — it's allowed to rank on its own. Only /kr/result is disallowed, for the
// same reason as /us/result below: it carries the visitor's own income in the
// query string (?d=&region=&gu=), so the combination space is unbounded.
// /us/result carries answers in the query string (?st=&co=&d=), so the
// combination space is unbounded — disallowing keeps crawl budget on
// pages that are actually worth indexing (home, state pages, insights, etc).
// No trailing slash: robots disallow is a literal path prefix, and
// "/us/result/" would NOT match the dashboard's own URL ("/us/result",
// no trailing slash) — only its old /overall,/state,/demographic subpaths.
// /us/compare/[inviteId] is the same situation — one unique, unindexable
// page per invite link (see that route's own generateMetadata, which also
// sets robots: {index:false} directly, belt-and-suspenders).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/kr/result", "/us/result", "/us/compare"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
