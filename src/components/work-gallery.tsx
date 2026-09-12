"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ImageFrame } from "@/components/image-frame";
import { Lightbox, type ViewerWork } from "@/components/lightbox";
import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";

export type GalleryWork = ViewerWork;

export interface GallerySeries {
  id: string;
  slug: string;
  title: string;
  years: string;
  meta: string;
  count: number;
  slot: string;
  ratio: number;
  imageKey: string | null;
}

type GridEntry =
  | { kind: "series"; item: GallerySeries }
  | { kind: "work"; item: GalleryWork; index: number };

/** Matches `columns: 3 260px` from the design: 3 columns, 260px minimum. */
const MAX_COLUMNS = 3;
const MIN_COLUMN_WIDTH = 260;

/** Room left for the sticky header, the caption and some air — see .work-grid. */
const VIEWPORT_RESERVE = 170;

/**
 * Roughly how tall a tile is, in multiples of the column width — capped the
 * same way the stylesheet caps it, or the tall works would be given far more
 * room than they end up taking and leave their column short.
 */
function weightOf(
  entry: GridEntry,
  columnWidth: number,
  maxTileHeight: number,
): number {
  const captionRows = entry.kind === "series" ? 0.36 : 0.28;
  const natural = 1 / Math.max(entry.item.ratio, 0.1);
  const capped =
    columnWidth > 0 && maxTileHeight > 0
      ? Math.min(natural, maxTileHeight / columnWidth)
      : natural;
  return capped + captionRows;
}

/**
 * Walks the items in order and drops each into whichever column is shortest
 * so far, ties going left. Reading order stays broadly left-to-right and top
 * to bottom, while columns still end up close to the same height — which
 * matters here because a panorama and a tall narrow sheet sit side by side.
 * CSS multi-column would balance too, but it fills the first column top to
 * bottom first and so scrambles the chronology.
 */
function toColumns(
  entries: GridEntry[],
  count: number,
  columnWidth: number,
  maxTileHeight: number,
): GridEntry[][] {
  const columns: GridEntry[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);

  for (const entry of entries) {
    let target = 0;
    for (let index = 1; index < count; index += 1) {
      if (heights[index] < heights[target] - 0.001) target = index;
    }
    columns[target].push(entry);
    heights[target] += weightOf(entry, columnWidth, maxTileHeight);
  }

  return columns;
}

function useGridMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    count: MAX_COLUMNS,
    columnWidth: 0,
    maxTileHeight: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const width = element.clientWidth;
      if (!width) return;
      const gap = Math.min(56, Math.max(26, width * 0.034));
      const fits = Math.floor((width + gap) / (MIN_COLUMN_WIDTH + gap));
      const count = Math.max(1, Math.min(MAX_COLUMNS, fits));

      setMetrics({
        count,
        columnWidth: (width - gap * (count - 1)) / count,
        maxTileHeight: Math.max(240, window.innerHeight - VIEWPORT_RESERVE),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // The column count follows the container, the cap follows the window.
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { ref, ...metrics };
}

export function WorkGallery({
  lang,
  works,
  series = [],
  counterTotal,
}: {
  lang: Lang;
  works: GalleryWork[];
  series?: GallerySeries[];
  /** Renders the "07 / 13" rule under the grid when given. */
  counterTotal?: number;
}) {
  const t = dict(lang);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const {
    ref: gridRef,
    count: columnCount,
    columnWidth,
    maxTileHeight,
  } = useGridMetrics();

  /* The viewer walks the works only; series cards open their own page. */

  const open = useCallback(
    (index: number) => {
      const work = works[index];
      if (!work) return;
      window.history.pushState(null, "", `/${lang}/works/${work.slug}`);
      setOpenIndex(index);
    },
    [works, lang],
  );

  const step = useCallback(
    (index: number) => {
      const work = works[index];
      if (!work) return;
      // Replace, so one Back press leaves the viewer rather than walking it.
      window.history.replaceState(null, "", `/${lang}/works/${work.slug}`);
      setOpenIndex(index);
    },
    [works, lang],
  );

  const close = useCallback(() => {
    window.history.back();
  }, []);

  /** Back and forward move in and out of the viewer. */
  useEffect(() => {
    const onPopState = () => {
      const match = /^\/(?:tr|en)\/works\/(.+)$/.exec(window.location.pathname);
      const slug = match?.[1];
      const index = slug ? works.findIndex((work) => work.slug === slug) : -1;
      setOpenIndex(index >= 0 ? index : null);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [works]);

  const items = useMemo<GridEntry[]>(
    () => [
      ...series.map((item) => ({ kind: "series" as const, item })),
      ...works.map((item, index) => ({ kind: "work" as const, item, index })),
    ],
    [series, works],
  );

  const columns = toColumns(items, columnCount, columnWidth, maxTileHeight);

  return (
    <>
      <div
        ref={gridRef}
        className="work-grid gutter mt-[clamp(34px,5vw,62px)] flex items-start gap-[clamp(26px,3.4vw,56px)] pb-2"
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="min-w-0 flex-1">
            {column.map((entry) =>
              entry.kind === "series" ? (
                <SeriesCard
                  key={entry.item.id}
                  lang={lang}
                  series={entry.item}
                  badge={`${t.seriesBadge} · ${entry.item.count}`}
                />
              ) : (
                <WorkTile
                  key={entry.item.id}
                  lang={lang}
                  work={entry.item}
                  onOpen={() => open(entry.index)}
                />
              ),
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="gutter mb-10 text-[13px] text-mute-2">{t.noWorks}</p>
      )}

      {counterTotal !== undefined && (
        <div className="gutter flex items-center gap-[14px] pb-[34px]">
          <span className="h-px flex-1 bg-rule" />
          <span className="mono-note">
            {String(items.length).padStart(2, "0")} /{" "}
            {String(counterTotal).padStart(2, "0")}
          </span>
        </div>
      )}

      {openIndex !== null && works[openIndex] && (
        <Lightbox
          lang={lang}
          works={works}
          index={openIndex}
          onStep={step}
          onClose={close}
        />
      )}
    </>
  );
}

function WorkTile({
  lang,
  work,
  onOpen,
}: {
  lang: Lang;
  work: GalleryWork;
  onOpen: () => void;
}) {
  return (
    <figure className="m-0 mb-[clamp(34px,4vw,66px)]">
      {/* A real link, so the work can be shared, opened in a new tab and
          crawled; a plain click opens the viewer instead of navigating. */}
      <a
        href={`/${lang}/works/${work.slug}`}
        className="block cursor-zoom-in"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          onOpen();
        }}
      >
        <ImageFrame
          imageKey={work.imageKey}
          slot={work.slot}
          ratio={work.ratio}
          alt={work.title}
          zoom
        />
        <figcaption className="mt-[14px]">
          <div className="font-serif text-[17px] leading-[1.3]">
            {work.title}
            <span className="text-mute-2 italic">, {work.year}</span>
          </div>
          <div className="mt-[5px] text-[11px] tracking-[0.05em] text-mute-2">
            {work.caption}
          </div>
        </figcaption>
      </a>
    </figure>
  );
}

function SeriesCard({
  lang,
  series,
  badge,
}: {
  lang: Lang;
  series: GallerySeries;
  badge: string;
}) {
  return (
    <figure className="m-0 mb-[clamp(34px,4vw,66px)]">
      <Link href={`/${lang}/series/${series.slug}`} className="block">
        {/* Two offset sheets behind the cover read as a stack of works. */}
        <div className="lift relative">
          <div className="absolute -top-[7px] right-[-7px] bottom-[7px] left-[7px] bg-[#efeee9]" />
          <div className="absolute -top-[3.5px] right-[-3.5px] bottom-[3.5px] left-[3.5px] bg-[#e6e5df]" />
          <div className="relative">
            <ImageFrame
              imageKey={series.imageKey}
              slot={series.slot}
              ratio={series.ratio}
              alt={series.title}
            />
          </div>
        </div>
        <figcaption className="mt-[18px]">
          <div className="mb-[7px] text-[9.5px] tracking-[0.2em] uppercase">
            {badge}
          </div>
          <div className="font-serif text-[19px] leading-[1.25]">
            {series.title}
            <span className="text-mute-2 italic">, {series.years}</span>
          </div>
          <div className="mt-[5px] text-[11px] tracking-[0.05em] text-mute-2">
            {series.meta}
          </div>
        </figcaption>
      </Link>
    </figure>
  );
}
