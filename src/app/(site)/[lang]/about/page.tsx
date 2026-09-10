import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImageFrame } from "@/components/image-frame";
import { getAbout, getCvEntries } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang, type Lang } from "@/lib/i18n";
import type { AboutBlock } from "@/lib/types";

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

/** Text reads at a comfortable measure; pictures run the full width. */
const BLOCK_WIDTH: Record<AboutBlock["type"], string> = {
  text: "62ch",
  quote: "34ch",
  image: "100%",
  pair: "100%",
};

function Block({ block, lang }: { block: AboutBlock; lang: Lang }) {
  if (block.type === "text") {
    return (
      <>
        {block.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="m-0 mb-[18px] text-[15px] leading-[1.78] text-ink-soft text-pretty last:mb-0"
          >
            {paragraph[lang]}
          </p>
        ))}
      </>
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

  if (block.type === "image") {
    return (
      <figure className="m-0">
        <ImageFrame
          imageKey={block.imageKey}
          ratio={block.ratio}
          alt={block.caption[lang]}
        />
        <figcaption className="mt-[11px] max-w-[56ch] text-[11.5px] tracking-[0.04em] text-mute-2">
          {block.caption[lang]}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="m-0">
      <div className="grid grid-cols-2 gap-[clamp(12px,2vw,24px)]">
        <ImageFrame
          imageKey={block.imageKeyA}
          ratio={block.ratioA}
          alt={block.caption[lang]}
        />
        <ImageFrame
          imageKey={block.imageKeyB}
          ratio={block.ratioB}
          alt={block.caption[lang]}
        />
      </div>
      <figcaption className="mt-[11px] max-w-[56ch] text-[11.5px] tracking-[0.04em] text-mute-2">
        {block.caption[lang]}
      </figcaption>
    </figure>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = dict(lang);
  const [about, cv] = await Promise.all([getAbout(), getCvEntries()]);

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

          <div className="grid gap-[22px] border-t border-rule pt-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))]">
            {about.facts.map((fact, index) => (
              <div key={index}>
                <div className="label mb-[9px]">{fact.label[lang]}</div>
                <div className="text-[12.5px] leading-[1.65] text-ink-soft">
                  {fact.a[lang]}
                </div>
                <div className="text-[12.5px] leading-[1.65] text-ink-soft">
                  {fact.b[lang]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex max-w-[1180px] flex-col gap-[clamp(34px,5vw,72px)]">
        {about.blocks.map((block, index) => (
          <section
            key={index}
            className="w-full min-w-0"
            style={{ maxWidth: BLOCK_WIDTH[block.type] }}
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

          {cv.map((entry) => (
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
              <div className="text-[9.5px] tracking-[0.16em] text-mute-3 uppercase">
                {entry.kind === "solo" ? t.soloShort : t.groupShort}
              </div>
            </div>
          ))}

          <div className="border-t border-[#f0efe9]" />
        </div>
      )}
    </main>
  );
}
