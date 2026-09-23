import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImageFrame } from "@/components/image-frame";
import { getAbout, getCvSections } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang, type Lang } from "@/lib/i18n";
import type { AboutBlock, AboutFact, Alignment, RowCell } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: dict(lang).nav.about,
    alternates: {
      canonical: `/${lang}/about`,
      languages: { tr: "/tr/about", en: "/en/about" },
    },
  };
}

/** Prose reads at a comfortable measure; pictures and strips run wide. */
function blockWidth(block: AboutBlock): string {
  if (block.type === "quote") return "34ch";
  if (block.type === "heading") return "100%";
  return block.cells.length === 1 && block.cells[0].kind === "text"
    ? "62ch"
    : "100%";
}

/**
 * A caption capped at 56ch is narrower than a wide column, so it needs telling
 * which edge to keep; the text inside it follows from `text-align`.
 */
const CAPTION_EDGE: Record<Alignment, string> = {
  start: "0 auto",
  center: "auto",
  end: "auto 0",
};

function Cell({ cell, lang }: { cell: RowCell; lang: Lang }) {
  // Across the column, and down the strip against the tallest field beside it.
  const placement: React.CSSProperties = {
    alignSelf: cell.align.y,
    textAlign: cell.align.x,
  };

  if (cell.kind === "text") {
    return (
      <div className="min-w-0" style={placement}>
        {cell.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="m-0 mb-[18px] text-[15px] leading-[1.78] text-ink-soft text-pretty last:mb-0"
          >
            {paragraph[lang]}
          </p>
        ))}
      </div>
    );
  }

  return (
    <figure className="m-0 min-w-0" style={placement}>
      <ImageFrame
        imageKey={cell.imageKey}
        ratio={cell.ratio}
        alt={cell.caption[lang]}
      />
      {cell.caption[lang] && (
        <figcaption
          className="mt-[11px] max-w-[56ch] text-[11.5px] tracking-[0.04em] text-mute-2"
          style={{ marginInline: CAPTION_EDGE[cell.align.x] }}
        >
          {cell.caption[lang]}
        </figcaption>
      )}
    </figure>
  );
}

function Block({ block, lang }: { block: AboutBlock; lang: Lang }) {
  if (block.type === "heading") {
    return (
      <h2 className="m-0 font-serif text-[clamp(19px,2.1vw,26px)] leading-[1.15] font-normal">
        {block.text[lang]}
      </h2>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="m-0 pt-1">
        <p className="m-0 mb-[14px] font-serif text-[clamp(22px,2.6vw,32px)] leading-[1.28] text-pretty">
          {block.quote[lang]}
        </p>
        <cite className="text-[11px] tracking-[0.1em] text-mute-3 not-italic">
          {block.by[lang]}
        </cite>
      </blockquote>
    );
  }

  return (
    <div
      className="strip"
      style={{ "--cols": block.cells.length } as React.CSSProperties}
    >
      {block.cells.map((cell, index) => (
        <Cell key={index} cell={cell} lang={lang} />
      ))}
    </div>
  );
}

/** A column with nothing in it is one the artist has not filled in yet. */
const hasContent = (fact: AboutFact, lang: Lang) =>
  Boolean(fact.label[lang]) || fact.lines.some((line) => line[lang]);

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = dict(lang);
  const [about, cv] = await Promise.all([getAbout(), getCvSections()]);
  const facts = about.facts.filter((fact) => hasContent(fact, lang));

  return (
    <main className="gutter relative z-1 flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <div className="ab-head">
        <ImageFrame
          imageKey={about.portraitKey}
          slot={about.portraitSlot[lang]}
          ratio={0.84}
          alt={about.lead[lang]}
          loading="eager"
        />

        <div>
          <h1 className="m-0 mb-[26px] max-w-[22ch] font-serif text-[clamp(25px,3vw,38px)] leading-[1.14] font-normal text-pretty">
            {about.lead[lang]}
          </h1>

          {facts.length > 0 && (
            <div className="grid gap-[22px] border-t border-rule pt-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))]">
              {facts.map((fact, index) => (
                <div key={index}>
                  <div className="label mb-[9px]">{fact.label[lang]}</div>
                  {fact.lines.map((line, position) => (
                    <div
                      key={position}
                      className="text-[12.5px] leading-[1.65] text-ink-soft"
                    >
                      {line[lang]}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ab-flow max-w-[1180px]">
        {about.blocks.map((block, index) => (
          <section
            key={index}
            className={`w-full min-w-0${block.type === "heading" ? " ab-heading" : ""}`}
            style={{ maxWidth: blockWidth(block) }}
          >
            <Block block={block} lang={lang} />
          </section>
        ))}
      </div>

      {cv.length > 0 && (
        <div className="mt-[clamp(44px,6vw,84px)] max-w-[1180px]">
          <div className="mb-[22px] flex items-baseline gap-4">
            <h2 className="m-0 font-serif text-[clamp(22px,2.4vw,30px)] leading-[1.1] font-normal">
              {t.cvTitle}
            </h2>
            <span className="h-px flex-1 bg-rule" />
          </div>

          {cv.map((section) => (
            <section
              key={section.group?.id ?? "unfiled"}
              className="mb-[clamp(26px,3vw,44px)] last:mb-0"
            >
              {section.group && (
                <h3 className="m-0 mb-[9px] text-[10.5px] font-normal tracking-[0.18em] text-mute uppercase">
                  {section.group.title[lang]}
                </h3>
              )}

              {section.entries.map((entry) => (
                <div key={entry.id} className="cv-row">
                  <div className="font-mono text-[10.5px] tracking-[0.12em] text-mute-3">
                    {entry.year}
                  </div>
                  <div className="text-[13.5px] leading-[1.55]">
                    {entry.url && entry.url !== "#" ? (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-[#e0ded6] pb-px transition-colors duration-200 hover:border-ink"
                      >
                        {entry.title[lang]}
                      </a>
                    ) : (
                      entry.title[lang]
                    )}
                  </div>
                  {/* Kept even when empty so the three columns stay aligned. */}
                  <div className="text-[9.5px] tracking-[0.16em] text-mute-3 uppercase">
                    {entry.kind === "solo" && t.soloShort}
                    {entry.kind === "group" && t.groupShort}
                  </div>
                </div>
              ))}

              <div className="border-t border-[#f0efe9]" />
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
