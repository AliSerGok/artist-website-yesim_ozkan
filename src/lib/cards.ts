import type { GallerySeries, GalleryWork } from "@/components/work-gallery";

import type { Lang } from "./i18n";
import type { Series, Work } from "./types";

const ratio = (work: { width: number; height: number }) =>
  Number((work.width / work.height).toFixed(3));

export function toGalleryWork(work: Work, lang: Lang): GalleryWork {
  return {
    id: work.id,
    slug: work.slug,
    medium: work.medium,
    title: work.title[lang],
    year: work.year,
    caption: work.caption[lang],
    note: work.note[lang],
    slot: work.slot,
    ratio: ratio(work),
    imageKey: work.imageKey,
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
    medium: series.medium,
    title: series.title[lang],
    years: series.years,
    meta: series.meta[lang],
    count: members.length,
    slot: cover?.slot ?? "",
    ratio: cover ? ratio(cover) : 0.8,
    imageKey: cover?.imageKey ?? null,
  };
}
