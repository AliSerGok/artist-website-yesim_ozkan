import type { HomeSlide } from "@/components/home-slideshow";
import type { GallerySeries, GalleryWork } from "@/components/work-gallery";

import type { HomeEntry } from "./content";
import { plainMap } from "./type-style";
import type { Lang } from "./i18n";
import type { HomeImageItem, Series, Work } from "./types";

const ratio = (work: { width: number; height: number }) =>
  Number((work.width / work.height).toFixed(3));

export function toGalleryWork(work: Work, lang: Lang): GalleryWork {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title[lang],
    year: work.year,
    caption: work.caption[lang],
    note: work.note[lang],
    slot: work.slot,
    ratio: ratio(work),
    imageKey: work.imageKey,
    styles: work.styles,
  };
}

/** The card fronts the series with its cover work, or its first work. */
export function toGallerySeries(
  series: Series,
  members: Work[],
  lang: Lang,
): GallerySeries {
  const cover =
    members.find((work) => work.id === series.coverWorkId) ?? members[0] ?? null;

  return {
    id: series.id,
    slug: series.slug,
    title: series.title[lang],
    years: series.years,
    meta: series.meta[lang],
    count: members.length,
    slot: cover?.slot ?? "",
    ratio: cover ? ratio(cover) : 0.8,
    imageKey: cover?.imageKey ?? null,
    styles: { title: series.styles.title, meta: series.styles.meta },
  };
}

/**
 * A picture put on the home page that is filed as a work nowhere else. It has
 * no page to go to, so the viewer shows it on the home page and nothing more:
 * the empty slug is what tells the viewer to leave the address alone.
 */
function toHomeImage(item: HomeImageItem, lang: Lang): GalleryWork {
  return {
    id: item.imageKey ?? "",
    slug: "",
    title: item.title[lang],
    year: item.aside[lang],
    caption: item.caption[lang],
    note: "",
    slot: "",
    ratio: item.ratio || 1,
    imageKey: item.imageKey,
    // A picture of its own has no note, so only two of the three are set.
    styles: { ...plainMap(["note"] as const), ...item.styles },
  };
}

/**
 * The home page shows the picture at full bleed with a line of text over it,
 * so a slide carries no note — whether it stands for a work or for a picture
 * of its own.
 */
export function toHomeSlide(entry: HomeEntry, lang: Lang): HomeSlide {
  if (entry.type === "work") {
    const { work, seriesSlug, bare } = entry;
    return {
      // Kept even on a bare slide: it is what the picture and its link are
      // called, which is not the same as what is written across it.
      title: work.title[lang],
      aside: work.year,
      caption: work.caption[lang],
      styles: { title: work.styles.title, caption: work.styles.caption },
      bare,
      slot: work.slot,
      imageKey: work.imageKey,
      target: seriesSlug
        ? { kind: "series", slug: work.slug, seriesSlug }
        : { kind: "work", slug: work.slug },
    };
  }

  const { item } = entry;
  return {
    title: item.title[lang],
    aside: item.aside[lang],
    caption: item.caption[lang],
    styles: item.styles,
    // Left unwritten by leaving all three of them blank.
    bare: false,
    slot: "",
    imageKey: item.imageKey,
    target: item.href
      ? { kind: "link", href: item.href }
      : { kind: "image", work: toHomeImage(item, lang) },
  };
}
