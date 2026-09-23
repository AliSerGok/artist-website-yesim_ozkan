import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkGallery } from "@/components/work-gallery";
import { toGalleryWork } from "@/lib/cards";
import { getSeriesBySlug, getWorksInSeries } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const series = await getSeriesBySlug(slug);
  if (!series) return {};

  return {
    title: series.title[lang],
    description: series.note[lang],
    alternates: {
      canonical: `/${lang}/series/${series.slug}`,
      languages: {
        tr: `/tr/series/${series.slug}`,
        en: `/en/series/${series.slug}`,
      },
    },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  const t = dict(lang);
  const works = await getWorksInSeries(series.id);

  return (
    <main className="relative z-1 flex-1 animate-fade-up pt-[clamp(30px,5vw,60px)] pb-[90px]">
      <div className="gutter">
        <Link
          href={`/${lang}/works`}
          className="mb-[clamp(26px,4vw,46px)] inline-block text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
        >
          {t.backToWorks}
        </Link>

        <div className="grid max-w-[1180px] items-end gap-[clamp(24px,4vw,64px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          <div>
            <div className="mb-3 text-[9.5px] tracking-[0.2em] text-mute-3 uppercase">
              {t.seriesBadge} · {works.length}
            </div>
            <h1 className="page-title">
              {series.title[lang]}
            </h1>
            <div className="mt-2.5 text-[12px] tracking-[0.08em] text-mute-2">
              {series.years} — {series.meta[lang]}
            </div>
          </div>
          <p className="m-0 max-w-[46ch] text-[14.5px] leading-[1.78] text-ink-soft text-pretty">
            {series.note[lang]}
          </p>
        </div>
      </div>

      <WorkGallery
        lang={lang}
        works={works.map((work) => toGalleryWork(work, lang))}
      />
    </main>
  );
}
