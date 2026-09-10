import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageFrame } from "@/components/image-frame";
import { getExhibitions } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: dict(lang).exhibitionsTitle,
    alternates: {
      canonical: `/${lang}/exhibitions`,
      languages: { tr: "/tr/exhibitions", en: "/en/exhibitions" },
    },
  };
}

export default async function ExhibitionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = dict(lang);
  const exhibitions = await getExhibitions();

  return (
    <main className="gutter relative z-1 max-w-[1240px] flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <div className="mb-[clamp(30px,4.5vw,58px)] flex flex-wrap items-end justify-between gap-6">
        <h1 className="page-title">{t.exhibitionsTitle}</h1>
        <Link
          href={`/${lang}/about`}
          className="border-b border-rule pb-[3px] text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
        >
          {t.fullList}
        </Link>
      </div>

      {exhibitions.map((exhibition, index) => (
        <article
          key={exhibition.id}
          className={`exh-item${index % 2 === 1 ? " flip" : ""}`}
        >
          <ImageFrame
            imageKey={exhibition.imageKey}
            ratio={1.5}
            alt={exhibition.title[lang]}
          />

          <div>
            <div className="mb-2.5 flex items-baseline gap-[14px]">
              <span className="font-mono text-[10px] tracking-[0.16em]">
                {exhibition.year}
              </span>
              <span className="text-[9.5px] tracking-[0.18em] text-mute-3 uppercase">
                {exhibition.kind[lang]}
              </span>
            </div>

            <h2 className="m-0 mb-2 font-serif text-[clamp(24px,2.8vw,34px)] leading-[1.12] font-normal">
              {exhibition.title[lang]}
            </h2>

            <div className="mb-4 text-[12.5px] tracking-[0.06em] text-mute-2">
              {exhibition.venue[lang]}
            </div>

            {exhibition.note[lang] && (
              <p className="m-0 mb-[18px] max-w-[46ch] text-[14px] leading-[1.75] text-ink-soft text-pretty">
                {exhibition.note[lang]}
              </p>
            )}

            {exhibition.url && exhibition.url !== "#" && (
              <a
                href={exhibition.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-b border-ink pb-[3px] text-[10px] tracking-[0.18em] uppercase"
              >
                {t.visit}
              </a>
            )}
          </div>
        </article>
      ))}

      <div className="border-t border-rule" />
    </main>
  );
}
