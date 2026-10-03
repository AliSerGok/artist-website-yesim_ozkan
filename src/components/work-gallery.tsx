"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ImageFrame } from "@/components/image-frame";
import { Lightbox, type ViewerWork } from "@/components/lightbox";
import { TitleLine } from "@/components/title-line";
import { dict } from "@/lib/dictionary";
import { styleAttrs, type StyleMap } from "@/lib/type-style";
import type { Lang } from "@/lib/i18n";
import { seriesHref, workHref, workInPath } from "@/lib/routes";

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
  styles: StyleMap<"title" | "meta" | "years">;
}

type GridEntry =
  | { kind: "series"; item: GallerySeries }
  | { kind: "work"; item: GalleryWork; index: number };

/**
 * The viewer asked for in the address has to be up in the same paint as the
 * grid, or the grid shows for a frame before it is covered. On the server
 * there is no paint to be ahead of, so the effect waits for the client.
 */
const useArrival = typeof window === "undefined" ? useEffect : useLayoutEffect;

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
  named: boolean,
): number {
  const captionRows = entry.kind === "series" ? 0.36 : named ? 0.28 : 0;
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
  named: boolean,
): GridEntry[][] {
  const columns: GridEntry[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);

  for (const entry of entries) {
    let target = 0;
    for (let index = 1; index < count; index += 1) {
      if (heights[index] < heights[target] - 0.001) target = index;
    }
    columns[target].push(entry);
    heights[target] += weightOf(entry, columnWidth, maxTileHeight, named);
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
      /*
       * The column the grid sits in, without the gutter: that padding is what
       * centres the page and grows with the window, so clientWidth on its own
       * would hand the columns room that is not theirs.
       */
      const style = getComputedStyle(element);
      const width =
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      if (!width || width < 0) return;
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
  openWork = null,
  showTitles = true,
}: {
  lang: Lang;
  works: GalleryWork[];
  series?: GallerySeries[];
  /** Renders the "07 / 13" rule under the grid when given. */
  counterTotal?: number;
  /**
   * A work to open the moment the page arrives, named by the `?work=` the
   * home page sends a series member here with.
   */
  openWork?: string | null;
  /**
   * Whether the works are named under their pictures. Off -- a series read as
   * one piece -- the grid is pictures alone; the viewer a picture opens into
   * still carries the name, the year and everything written about the work.
   */
  showTitles?: boolean;
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
      window.history.pushState(null, "", workHref(lang, work.slug));
      setOpenIndex(index);
    },
    [works, lang],
  );

  const step = useCallback(
    (index: number) => {
      const work = works[index];
      if (!work) return;
      // Replace, so one Back press leaves the viewer rather than walking it.
      window.history.replaceState(null, "", workHref(lang, work.slug));
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
      const slug = workInPath(window.location.pathname);
      const index = slug ? works.findIndex((work) => work.slug === slug) : -1;
      setOpenIndex(index >= 0 ? index : null);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [works]);

  /**
   * Arriving with a work named in the address: the query is dropped first, so
   * the entry left behind is this page plain, and the work is pushed on top
   * of it. Back then uncovers the page under the viewer, and the press after
   * that leaves for wherever the reader came from.
   *
   * The query in the address is the request, and dropping it is what answers
   * it — the prop cannot be, because it is baked into the payload the entry
   * keeps and would ask again every time the entry is walked back onto.
   */
  useArrival(() => {
    if (!openWork) return;
    if (new URLSearchParams(window.location.search).get("work") !== openWork) {
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);

    const index = works.findIndex((work) => work.slug === openWork);
    if (index < 0) return;

    window.history.pushState(null, "", workHref(lang, openWork));
    setOpenIndex(index);
  }, [openWork, works, lang]);

  const items = useMemo<GridEntry[]>(
    () => [
      ...series.map((item) => ({ kind: "series" as const, item })),
      ...works.map((item, index) => ({ kind: "work" as const, item, index })),
    ],
    [series, works],
  );

  const columns = toColumns(
    items,
    columnCount,
    columnWidth,
    maxTileHeight,
    showTitles,
  );

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
                  named={showTitles}
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
  named,
  onOpen,
}: {
  lang: Lang;
  work: GalleryWork;
  /** Whether the work is named under its picture; see WorkGallery. */
  named: boolean;
  onOpen: () => void;
}) {
  return (
    <figure className="m-0 mb-[clamp(34px,4vw,66px)]">
      {/* A real link, so the work can be shared, opened in a new tab and
          crawled; a plain click opens the viewer instead of navigating. */}
      <a
        href={workHref(lang, work.slug)}
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
        {named && (
          <figcaption className="mt-[14px]">
            <TitleLine
              title={work.title}
              aside={work.year}
              className="font-serif text-[17px] leading-[1.3]"
              style={work.styles.title}
              asideStyle={work.styles.year}
            />
            {work.caption && (
              <div
                className="mt-[5px] text-[11px] tracking-[0.05em] text-mute-2"
                {...styleAttrs(work.styles.caption)}
              >
                {work.caption}
              </div>
            )}
          </figcaption>
        )}
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
      <Link href={seriesHref(lang, series.slug)} className="block">
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
          <TitleLine
            title={series.title}
            aside={series.years}
            className="font-serif text-[19px] leading-[1.25]"
            style={series.styles.title}
            asideStyle={series.styles.years}
          />
          {series.meta && (
            <div
              className="mt-[5px] text-[11px] tracking-[0.05em] text-mute-2"
              {...styleAttrs(series.styles.meta)}
            >
              {series.meta}
            </div>
          )}
        </figcaption>
      </Link>
    </figure>
  );
}
