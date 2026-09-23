import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getSeriesList,
  getSingleWorks,
  getWork,
  getWorksInSeries,
} from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { Work } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const work = await getWork(slug);
  if (!work) return {};

  return {
    title: `${work.title[lang]}, ${work.year}`,
    description: work.note[lang] || work.caption[lang],
    alternates: {
      canonical: `/${lang}/works/${work.slug}`,
      languages: { tr: `/tr/works/${work.slug}`, en: `/en/works/${work.slug}` },
    },
  };
}

/** Neighbours come from the list the work belongs to: its series, or the grid. */
async function siblings(work: Work): Promise<Work[]> {
  return work.seriesId
    ? getWorksInSeries(work.seriesId)
    : getSingleWorks();
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const work = await getWork(slug);
  if (!work) notFound();

  const t = dict(lang);
  const ratio = Number((work.width / work.height).toFixed(3));
  const list = await siblings(work);
  const index = list.findIndex((item) => item.id === work.id);
  const previous = list[index - 1] ?? null;
  const next = list[index + 1] ?? null;

  const series = work.seriesId
    ? ((await getSeriesList()).find((item) => item.id === work.seriesId) ?? null)
    : null;

  return (
    <main className="gutter relative z-1 flex-1 animate-fade-up pt-[clamp(30px,5vw,60px)] pb-[110px]">
      <Link
        href={series ? `/${lang}/series/${series.slug}` : `/${lang}/works`}
        className="inline-block text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
      >
        {series ? t.backToSeries : t.backToWorks}
      </Link>

      <div className="mt-[clamp(26px,4vw,48px)] grid items-start gap-[clamp(30px,5vw,74px)] lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {work.imageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(work.imageKey, "full")}
            alt={work.title[lang]}
            className="work-image"
            style={{ "--ar": ratio } as React.CSSProperties}
          />
        ) : (
          <div
            className="slot work-image"
            style={
              { "--ar": ratio, aspectRatio: ratio } as React.CSSProperties
            }
          >
            <span lang="en">{work.slot}</span>
          </div>
        )}

        <div className="max-w-[46ch]">
          <h1 className="page-title">
            {work.title[lang]}
            <span className="text-mute-2 italic">, {work.year}</span>
          </h1>
          <p className="mt-[22px] text-[14.5px] leading-[1.78] text-ink-soft">
            {work.caption[lang]}
          </p>

          {work.note[lang] && (
            <p className="mt-[18px] text-[14.5px] leading-[1.78] text-ink-soft text-pretty">
              {work.note[lang]}
            </p>
          )}

          <div className="mt-[26px] grid gap-5 border-t border-rule pt-[18px] sm:grid-cols-2">
            <div>
              <div className="label mb-[9px]">{t.mediumLabel}</div>
              <div className="text-[12.5px] leading-[1.65] text-ink-soft capitalize">
                {t.medium[work.medium]}
              </div>
            </div>
            {series && (
              <div>
                <div className="label mb-[9px]">{t.seriesBadge}</div>
                <Link
                  href={`/${lang}/series/${series.slug}`}
                  className="text-[12.5px] leading-[1.65] text-ink-soft underline-offset-4 hover:underline"
                >
                  {series.title[lang]}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="mt-[clamp(40px,6vw,80px)] flex justify-between gap-6 border-t border-rule pt-[18px]">
        <span>
          {previous && (
            <Link
              href={`/${lang}/works/${previous.slug}`}
              className="text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
            >
              ← {previous.title[lang]}
            </Link>
          )}
        </span>
        <span className="text-right">
          {next && (
            <Link
              href={`/${lang}/works/${next.slug}`}
              className="text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
            >
              {next.title[lang]} →
            </Link>
          )}
        </span>
      </nav>
    </main>
  );
}
