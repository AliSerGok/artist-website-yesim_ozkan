import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageFrame } from "@/components/image-frame";
import { getExhibitionBySlug } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";
import { styleAttrs } from "@/lib/type-style";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const exhibition = await getExhibitionBySlug(slug);
  if (!exhibition) return {};

  return {
    title: exhibition.title[lang],
    description: exhibition.note[lang],
    alternates: {
      canonical: `/${lang}/exhibitions/${exhibition.slug}`,
      languages: {
        tr: `/tr/exhibitions/${exhibition.slug}`,
        en: `/en/exhibitions/${exhibition.slug}`,
      },
    },
  };
}

/**
 * A show on its own, where the whole of its text is read. The exhibitions
 * page cuts a long note short and sends the reader here for the rest of it;
 * nothing is written here that is not written there, only all of it.
 */
export default async function ExhibitionPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const exhibition = await getExhibitionBySlug(slug);
  if (!exhibition) notFound();

  const t = dict(lang);
  const paragraphs = exhibition.note[lang]
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <main className="gutter relative z-1 flex-1 animate-fade-up pt-[clamp(30px,5vw,60px)] pb-[110px]">
      <Link
        href={`/${lang}/exhibitions`}
        className="mb-[clamp(26px,4vw,46px)] inline-block text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
      >
        {t.backToExhibitions}
      </Link>

      <div className="mb-2.5 flex items-baseline gap-[14px]">
        <span
          className="font-mono text-[10px] tracking-[0.16em]"
          {...styleAttrs(exhibition.styles.title)}
        >
          {exhibition.year}
        </span>
        {exhibition.kind[lang] && (
          <span
            className="text-[9.5px] tracking-[0.18em] text-mute-3 uppercase"
            {...styleAttrs(exhibition.styles.kind)}
          >
            {exhibition.kind[lang]}
          </span>
        )}
      </div>

      <h1 className="page-title" {...styleAttrs(exhibition.styles.title)}>
        {exhibition.title[lang]}
      </h1>

      {exhibition.venue[lang] && (
        <div
          className="mt-2.5 text-[12.5px] tracking-[0.06em] text-mute-2"
          {...styleAttrs(exhibition.styles.venue)}
        >
          {exhibition.venue[lang]}
        </div>
      )}

      {exhibition.imageKey && (
        <div className="mt-[clamp(26px,4vw,48px)] max-w-[940px]">
          <ImageFrame
            imageKey={exhibition.imageKey}
            ratio={1.5}
            alt={exhibition.title[lang]}
          />
        </div>
      )}

      {paragraphs.length > 0 && (
        <div
          className="mt-[clamp(26px,4vw,46px)] flex flex-col gap-[1.1em] text-[15px] leading-[1.8] text-ink-soft text-pretty"
          {...styleAttrs(exhibition.styles.note)}
        >
          {paragraphs.map((part, index) => (
            <p key={index} className="m-0">
              {part}
            </p>
          ))}
        </div>
      )}

      {exhibition.url && exhibition.url !== "#" && (
        <a
          href={exhibition.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-[clamp(26px,4vw,42px)] inline-block border-b border-ink pb-[3px] text-[10px] tracking-[0.18em] uppercase"
        >
          {t.visit}
        </a>
      )}
    </main>
  );
}
