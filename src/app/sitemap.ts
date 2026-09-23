import type { MetadataRoute } from "next";

import { getSeriesList, getWorks } from "@/lib/content";
import { LANGS } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [works, series] = await Promise.all([getWorks(), getSeriesList()]);
  const sections = ["", "/works", "/exhibitions", "/about", "/contact"];

  const pages = LANGS.flatMap((lang) => [
    ...sections.map((section) => `/${lang}${section}`),
    ...series.map((item) => `/${lang}/series/${item.slug}`),
    ...works.map((work) => `/${lang}/works/${work.slug}`),
  ]);

  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority: path.endsWith("/tr") || path.endsWith("/en") ? 1 : 0.7,
  }));
}
