// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ohayouanime.lovable.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/browse", changefreq: "daily", priority: "0.9" },
  { path: "/search", changefreq: "weekly", priority: "0.6" },
  { path: "/shorts", changefreq: "daily", priority: "0.8" },
  { path: "/copyright-policy", changefreq: "yearly", priority: "0.2" },
];

async function fetchRows(table: string, select: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function buildSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const series = await fetchRows("series", "id,updated_at");
  const episodes = await fetchRows("episodes_public", "id,updated_at");
  const entries: SitemapEntry[] = [
    ...staticEntries,
    ...series.map((s: any) => ({
      path: `/series/${s.id}`,
      lastmod: s.updated_at?.slice(0, 10),
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
    ...episodes.map((e: any) => ({
      path: `/watch/${e.id}`,
      lastmod: e.updated_at?.slice(0, 10),
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
  ];
  writeFileSync(resolve("public/sitemap.xml"), buildSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
