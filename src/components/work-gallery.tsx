"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Lightbox, type ViewerWork } from "@/components/lightbox";
import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { Medium } from "@/lib/types";

export interface GalleryWork extends ViewerWork {
  medium: Medium;
}

export interface GallerySeries {
  id: string;
  slug: string;
  medium: Medium;
  title: string;
  years: string;
  meta: string;
  count: number;
  slot: string;
  ratio: number;
  imageKey: string | null;
}

type Filter = "all" | Medium;

const FILTERS: Filter[] = ["all", "paintings", "prints", "paper"];

/** Matches `columns: 3 260px` from the design: 3 columns, 260px minimum. */
const MAX_COLUMNS = 3;
const MIN_COLUMN_WIDTH = 260;

/**
 * Distributes items round-robin so reading order stays left-to-right.
 * CSS multi-column would fill the first column top to bottom instead,
 * which scrambles the chronology of the grid.
 */
function toColumns<T>(items: T[], count: number): T[][] {
  const columns: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => columns[index % count].push(item));
  return columns;
}

function useColumnCount() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(MAX_COLUMNS);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const width = element.clientWidth;
      if (!width) return;
      const gap = Math.min(56, Math.max(26, width * 0.034));
      const fits = Math.floor((width + gap) / (MIN_COLUMN_WIDTH + gap));
      setCount(Math.max(1, Math.min(MAX_COLUMNS, fits)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, count };
}

export function WorkGallery({
  lang,
  works,
  series = [],
  showFilter = false,
  counterTotal,
}: {
  lang: Lang;
  works: GalleryWork[];
  series?: GallerySeries[];
  showFilter?: boolean;
  /** Renders the "03 / 07" rule under the grid when given. */
  counterTotal?: number;
}) {
  const t = dict(lang);
  const [filter, setFilter] = useState<Filter>("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref: gridRef, count: columnCount } = useColumnCount();

  const visibleSeries = useMemo(
    () =>
      series.filter((item) => filter === "all" || item.medium === filter),
    [series, filter],
  );

  const visibleWorks = useMemo(
    () => works.filter((work) => filter === "all" || work.medium === filter),
    [works, filter],
  );

  /* The viewer walks the works only; series cards open their own page. */

  const open = useCallback(
    (index: number) => {
      const work = visibleWorks[index];
      if (!work) return;
      window.history.pushState(null, "", `/${lang}/works/${work.slug}`);
      setOpenIndex(index);
    },
    [visibleWorks, lang],
  );

  const step = useCallback(
    (index: number) => {
      const work = visibleWorks[index];
      if (!work) return;
      // Replace, so one Back press leaves the viewer rather than walking it.
      window.history.replaceState(null, "", `/${lang}/works/${work.slug}`);
      setOpenIndex(index);
    },
    [visibleWorks, lang],
  );

  const close = useCallback(() => {
    window.history.back();
  }, []);

  /** Back and forward move in and out of the viewer. */
  useEffect(() => {
    const onPopState = () => {
      const match = /^\/(?:tr|en)\/works\/(.+)$/.exec(window.location.pathname);
      const slug = match?.[1];
      const index = slug
        ? visibleWorks.findIndex((work) => work.slug === slug)
        : -1;
      setOpenIndex(index >= 0 ? index : null);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [visibleWorks]);

  const items = useMemo(
    () => [
      ...visibleSeries.map((item) => ({ kind: "series" as const, item })),
      ...visibleWorks.map((item, index) => ({
        kind: "work" as const,
        item,
        index,
      })),
    ],
    [visibleSeries, visibleWorks],
  );

  const columns = toColumns(items, columnCount);
  const dim = (id: string) => hovered !== null && hovered !== id;

  return (
    <>
      {showFilter && (
        <div className="gutter flex flex-wrap items-end justify-between gap-6">
          <h1 className="page-title">{t.worksTitle}</h1>
          <div className="flex flex-wrap items-baseline gap-[clamp(12px,2vw,26px)]">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key);
                  setHovered(null);
                }}
                className="filter-link cursor-pointer"
                data-active={filter === key}
              >
                {t.medium[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        className="gutter mt-[clamp(34px,5vw,62px)] flex items-start gap-[clamp(26px,3.4vw,56px)] pb-2"
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
                  dimmed={dim(entry.item.id)}
                  onEnter={() => setHovered(entry.item.id)}
                  onLeave={() => setHovered(null)}
                />
              ) : (
                <WorkTile
                  key={entry.item.id}
                  lang={lang}
                  work={entry.item}
                  dimmed={dim(entry.item.id)}
                  onEnter={() => setHovered(entry.item.id)}
                  onLeave={() => setHovered(null)}
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

      {openIndex !== null && visibleWorks[openIndex] && (
        <Lightbox
          lang={lang}
          works={visibleWorks}
          index={openIndex}
          onStep={step}
          onClose={close}
        />
      )}
    </>
  );
}

function Tile({
  imageKey,
  slot,
  ratio,
  alt,
  variant = "grid",
}: {
  imageKey: string | null;
  slot: string;
  ratio: number;
  alt: string;
  variant?: "grid";
}) {
  if (!imageKey) {
    return (
      <div className="slot w-full" style={{ aspectRatio: ratio }}>
        <span lang="en">{slot}</span>
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-hidden bg-panel"
      style={{ aspectRatio: ratio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaUrl(imageKey, variant)}
        alt={alt}
        loading="lazy"
        className="block h-full w-full object-cover"
      />
    </div>
  );
}

function WorkTile({
  lang,
  work,
  dimmed,
  onEnter,
  onLeave,
  onOpen,
}: {
  lang: Lang;
  work: GalleryWork;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onOpen: () => void;
}) {
  return (
    <figure className="m-0 mb-[clamp(34px,4vw,66px)]">
      {/* A real link, so the work can be shared, opened in a new tab and
          crawled; a plain click opens the viewer instead of navigating. */}
      <a
        href={`/${lang}/works/${work.slug}`}
        className="block cursor-zoom-in"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          onOpen();
        }}
      >
        <div
          className="transition-opacity duration-[480ms] ease-out"
          style={{ opacity: dimmed ? 0.42 : 1 }}
        >
          <Tile
            imageKey={work.imageKey}
            slot={work.slot}
            ratio={work.ratio}
            alt={work.title}
          />
        </div>
        <figcaption
          className="mt-[14px] transition-opacity duration-[340ms] ease-out"
          style={{ opacity: dimmed ? 0.3 : 1 }}
        >
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
  dimmed,
  onEnter,
  onLeave,
}: {
  lang: Lang;
  series: GallerySeries;
  badge: string;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <figure className="m-0 mb-[clamp(34px,4vw,66px)]">
      <Link
        href={`/${lang}/series/${series.slug}`}
        className="block"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {/* Two offset sheets behind the cover read as a stack of works. */}
        <div
          className="relative transition-opacity duration-[480ms] ease-out"
          style={{ opacity: dimmed ? 0.42 : 1 }}
        >
          <div className="absolute -top-[7px] right-[-7px] bottom-[7px] left-[7px] bg-[#efeee9]" />
          <div className="absolute -top-[3.5px] right-[-3.5px] bottom-[3.5px] left-[3.5px] bg-[#e6e5df]" />
          <div className="relative">
            <Tile
              imageKey={series.imageKey}
              slot={series.slot}
              ratio={series.ratio}
              alt={series.title}
            />
          </div>
        </div>
        <figcaption
          className="mt-[18px] transition-opacity duration-[340ms] ease-out"
          style={{ opacity: dimmed ? 0.3 : 1 }}
        >
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
