import type { Localized } from "./i18n";

/** Technique a work or a series is filed under. */
export const MEDIUMS = ["paintings", "prints", "paper"] as const;

export type Medium = (typeof MEDIUMS)[number];

export interface Work {
  id: string;
  slug: string;
  medium: Medium;
  /** Set when the work belongs to a series; such works are shown inside it. */
  seriesId: string | null;
  year: string;
  /** Lower sorts first. */
  order: number;
  title: Localized;
  /** Technique and dimensions, e.g. "Ketende yağlıboya, 120 × 90 cm". */
  caption: Localized;
  /** Longer text shown in the viewer. */
  note: Localized;
  /** Intrinsic image size, used for the aspect ratio of the tile. */
  width: number;
  height: number;
  /** Placeholder caption shown until a real image is uploaded. */
  slot: string;
  imageKey: string | null;
  published: boolean;
}

export interface Series {
  id: string;
  slug: string;
  medium: Medium;
  /** Year range, e.g. "2023–2025". */
  years: string;
  order: number;
  title: Localized;
  /** Short line under the title, e.g. "4 iş, serigrafi". */
  meta: Localized;
  note: Localized;
  /** Id of the work whose image fronts the series card. */
  coverWorkId: string | null;
  published: boolean;
}

export interface Exhibition {
  id: string;
  year: string;
  order: number;
  title: Localized;
  venue: Localized;
  kind: Localized;
}

export interface AboutFact {
  label: Localized;
  a: Localized;
  b: Localized;
}

export interface AboutContent {
  lead: Localized;
  paragraphs: Localized[];
  facts: AboutFact[];
  portraitSlot: Localized;
  portraitKey: string | null;
}

export interface ContactRow {
  label: Localized;
  value: string;
  href: string;
}

export interface ContactContent {
  lead: Localized;
  note: Localized;
  rows: ContactRow[];
}
