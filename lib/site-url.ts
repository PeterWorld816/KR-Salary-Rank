// Single source of truth for the site's public base URL. Every absolute URL
// in metadata — canonical, og:url, og:image, twitter:image — must go through
// getSiteUrl()/absoluteUrl() here, not read NEXT_PUBLIC_SITE_URL directly.
// That's what past-us got wrong: app/layout.tsx used to fall back straight
// to "http://localhost:3000" for metadataBase, which then got baked into
// every deployed page's meta tags whenever NEXT_PUBLIC_SITE_URL wasn't set.
//
// Priority:
//   1. NEXT_PUBLIC_SITE_URL   — explicit, always wins
//   2. URL                    — Netlify: production deploy's URL
//   3. DEPLOY_PRIME_URL       — Netlify: preview/branch deploy's URL
//   4. production domain      — production builds without deploy env vars
//   5. http://localhost:3000  — local development only
//
// NOTE: lib/ads.ts intentionally does NOT use this — it needs the one fixed
// production domain to gate ad-loading against, and #2/#3 above are each
// deploy's own URL (so on Netlify every preview would trivially "match
// itself" and ads would load everywhere). Keep that check on
// NEXT_PUBLIC_SITE_URL alone.

function normalize(raw: string): string {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, ""); // no trailing slash, or `${base}/${path}` doubles up
}

export function getSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (candidate) return normalize(candidate);

  if (process.env.NODE_ENV === "production") return "https://krsalaryrank.netlify.app";
  return "http://localhost:3000";
}

// Resolves `path` against getSiteUrl(). Already-absolute input (an external
// og:image URL from article frontmatter, say) passes through untouched.
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
