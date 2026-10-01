import { ImageFrame } from "@/components/image-frame";
import type { CvSection } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";
import type {
  AboutBlock,
  AboutContent,
  AboutFact,
  RowCell,
} from "@/lib/types";

/*
 * How the about page is set, in one place: the site renders the whole flow,
 * the panel renders a block at a time to show what a card will look like
 * once it is saved. Neither can drift from the other.
 *
 * What a block's menus control -- how far it spreads, which edge it keeps,
 * how big it is set -- is written as data attributes and answered by
 * globals.css, so the panel can change one on a preview without re-rendering
 * anything and still get the page's own answer.
 */

/** Blocks that open a chapter of their own stand further from what is above. */
const EXTRA_AIR: Partial<Record<AboutBlock["type"], string>> = {
  heading: " ab-heading",
  cv: " ab-cv",
};

function Cell({ cell, lang }: { cell: RowCell; lang: Lang }) {
  if (cell.kind === "text") {
    return (
      <div
        className="ab-text ab-cell min-w-0"
        data-width={cell.width}
        data-size={cell.size}
        data-align={cell.align.x}
        data-align-y={cell.align.y}
      >
        {cell.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph[lang]}</p>
        ))}
      </div>
    );
  }

  return (
    <figure
      className="ab-figure ab-cell m-0 min-w-0"
      data-align={cell.align.x}
      data-align-y={cell.align.y}
    >
      <ImageFrame
        imageKey={cell.imageKey}
        ratio={cell.ratio}
        alt={cell.caption[lang]}
      />
      {cell.caption[lang] && (
        <figcaption className="ab-caption">{cell.caption[lang]}</figcaption>
      )}
    </figure>
  );
}

/** The participation list, wherever in the flow the artist has put it. */
function CvList({
  title,
  sections,
  lang,
}: {
  title: string;
  sections: CvSection[];
  lang: Lang;
}) {
  const t = dict(lang);

  return (
    <>
      {title && (
        <div className="mb-[22px] flex items-baseline gap-4">
          <h2 className="m-0 font-serif text-[clamp(22px,2.4vw,30px)] leading-[1.1] font-normal">
            {title}
          </h2>
          <span className="h-px flex-1 bg-rule" />
        </div>
      )}

      {sections.map((section) => (
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
    </>
  );
}

function Block({
  block,
  lang,
  cv,
}: {
  block: AboutBlock;
  lang: Lang;
  cv: CvSection[];
}) {
  if (block.type === "cv") {
    return <CvList title={block.title[lang]} sections={cv} lang={lang} />;
  }

  if (block.type === "heading") {
    return (
      <h2 className="ab-title" data-size={block.size}>
        {block.text[lang]}
      </h2>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="m-0 pt-1">
        <p className="ab-quote" data-size={block.size}>
          {block.quote[lang]}
        </p>
        <cite className="ab-cite">{block.by[lang]}</cite>
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

/** One block, set the way the page sets it. */
export function AboutBlockView({
  block,
  lang,
  cv,
}: {
  block: AboutBlock;
  lang: Lang;
  cv: CvSection[];
}) {
  const spread =
    block.type === "heading" || block.type === "quote"
      ? { "data-width": block.width, "data-align": block.align }
      : {};

  return (
    <section
      className={`ab-block w-full min-w-0${EXTRA_AIR[block.type] ?? ""}`}
      {...spread}
    >
      <Block block={block} lang={lang} cv={cv} />
    </section>
  );
}

/** A column with nothing in it is one the artist has not filled in yet. */
export const hasContent = (fact: AboutFact, lang: Lang) =>
  Boolean(fact.label[lang]) || fact.lines.some((line) => line[lang]);

/** The portrait, the opening sentence and the columns beside them. */
export function AboutHead({
  about,
  lang,
}: {
  about: AboutContent;
  lang: Lang;
}) {
  const facts = about.facts.filter((fact) => hasContent(fact, lang));

  return (
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
  );
}

/** Every block of the page, in order. */
export function AboutFlow({
  blocks,
  lang,
  cv,
}: {
  blocks: AboutBlock[];
  lang: Lang;
  cv: CvSection[];
}) {
  return (
    <div className="ab-flow max-w-[1180px]">
      {blocks.map((block, index) => (
        <AboutBlockView key={index} block={block} lang={lang} cv={cv} />
      ))}
    </div>
  );
}

/** The list waits for its first line; until then its block is not on the page. */
export function visibleBlocks(
  blocks: AboutBlock[],
  cv: CvSection[],
): AboutBlock[] {
  return cv.length > 0 ? blocks : blocks.filter((block) => block.type !== "cv");
}
