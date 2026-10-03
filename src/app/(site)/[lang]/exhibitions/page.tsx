import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageFrame } from "@/components/image-frame";
import { getExhibitionLayout, getExhibitions } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { exhibitionHref } from "@/lib/routes";
import { styleAttrs } from "@/lib/type-style";
import { isLang } from "@/lib/i18n";

/**
 * How much of a show's text this page carries. Past it the note is cut at a
 * word and the reader is sent to the show's own page for the whole of it --
 * a paragraph beside a picture, not an essay.
 */
const NOTE_LIMIT = 240;

/** The note as this page tells it, and whether it stops short. */
function shorten(note: string): { text: string; cut: boolean } {
  const flat = note.replace(/\s+/g, " ").trim();
  if (flat.length <= NOTE_LIMIT) return { text: flat, cut: false };

  const clipped = flat.slice(0, NOTE_LIMIT);
  const lastSpace = clipped.lastIndexOf(" ");

  return {
    // Cut at a word, unless the text has none to cut at.
    text: `${(lastSpace > NOTE_LIMIT * 0.6 ? clipped.slice(0, lastSpace) : clipped).replace(/[.,;:—–-]+$/, "")}…`,
    cut: true,
  };
}

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
  const [exhibitions, layout] = await Promise.all([
    getExhibitions(),
    getExhibitionLayout(),
  ]);

  return (
    <main className="gutter relative z-1 flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <div className="mb-[clamp(30px,4.5vw,58px)] flex flex-wrap items-end justify-between gap-6">
        <h1 className="page-title">{t.exhibitionsTitle}</h1>
        <Link
          href={`/${lang}/about`}
          className="border-b border-rule pb-[3px] text-[10px] tracking-[0.18em] text-mute-3 uppercase transition-colors duration-200 hover:text-ink"
        >
          {t.fullList}
        </Link>
      </div>

      {exhibitions.map((exhibition, index) => {
        const note = shorten(exhibition.note[lang]);
        const href = exhibitionHref(lang, exhibition.slug);
        /* Left by default; "alternate" turns every second one over, "right"
           turns them all. */
        const flipped =
          layout === "right" || (layout === "alternate" && index % 2 === 1);

        return (
          <article
            key={exhibition.id}
            className={`exh-item${flipped ? " flip" : ""}`}
          >
            <ImageFrame
              imageKey={exhibition.imageKey}
              ratio={1.5}
              alt={exhibition.title[lang]}
            />

            <div>
              <div className="mb-2.5 flex items-baseline gap-[14px]">
                <span
                  className="font-mono text-[10px] tracking-[0.16em]"
                  {...styleAttrs(exhibition.styles.title)}
                >
                  {exhibition.year}
                </span>
                <span
                  className="text-[9.5px] tracking-[0.18em] text-mute-3 uppercase"
                  {...styleAttrs(exhibition.styles.kind)}
                >
                  {exhibition.kind[lang]}
                </span>
              </div>

              <h2 className="m-0 mb-2">
                <Link
                  href={href}
                  className="font-serif text-[clamp(24px,2.8vw,34px)] leading-[1.12] font-normal transition-colors duration-200 hover:text-mute"
                  {...styleAttrs(exhibition.styles.title)}
                >
                  {exhibition.title[lang]}
                </Link>
              </h2>

              <div
                className="mb-4 text-[12.5px] tracking-[0.06em] text-mute-2"
                {...styleAttrs(exhibition.styles.venue)}
              >
                {exhibition.venue[lang]}
              </div>

              {note.text && (
                <p
                  className="m-0 mb-[18px] text-[14px] leading-[1.75] text-ink-soft text-pretty"
                  {...styleAttrs(exhibition.styles.note)}
                >
                  {note.text}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-[22px] gap-y-2.5">
                {note.cut && (
                  <Link
                    href={href}
                    className="inline-block border-b border-ink pb-[3px] text-[10px] tracking-[0.18em] uppercase"
                  >
                    {t.exhibitionMore}
                  </Link>
                )}

                {exhibition.url && exhibition.url !== "#" && (
                  <a
                    href={exhibition.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border-b border-rule-2 pb-[3px] text-[10px] tracking-[0.18em] text-mute uppercase transition-colors duration-200 hover:border-ink hover:text-ink"
                  >
                    {t.visit}
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}

      <div className="border-t border-rule" />
    </main>
  );
}
