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

/** The handful of shows given the full editorial treatment. */
export interface Exhibition {
  id: string;
  year: string;
  order: number;
  title: Localized;
  venue: Localized;
  kind: Localized;
  note: Localized;
  url: string;
  imageKey: string | null;
  published: boolean;
}

export const CV_KINDS = ["solo", "group"] as const;

export type CvKind = (typeof CV_KINDS)[number];

/** One line of the complete exhibition list on the about page. */
export interface CvEntry {
  id: string;
  year: string;
  order: number;
  title: Localized;
  kind: CvKind;
  url: string;
  published: boolean;
}

export interface AboutFact {
  label: Localized;
  a: Localized;
  b: Localized;
}

export const BLOCK_TYPES = ["text", "image", "pair", "quote"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export interface TextBlock {
  type: "text";
  paragraphs: Localized[];
}

export interface ImageBlock {
  type: "image";
  imageKey: string | null;
  ratio: number;
  caption: Localized;
}

export interface PairBlock {
  type: "pair";
  imageKeyA: string | null;
  ratioA: number;
  imageKeyB: string | null;
  ratioB: number;
  caption: Localized;
}

export interface QuoteBlock {
  type: "quote";
  quote: Localized;
  by: Localized;
}

/** The about page is a stream of these, in order. */
export type AboutBlock = TextBlock | ImageBlock | PairBlock | QuoteBlock;

export interface AboutContent {
  lead: Localized;
  facts: AboutFact[];
  blocks: AboutBlock[];
  portraitSlot: Localized;
  portraitKey: string | null;
}

export interface ContactRow {
  label: Localized;
  value: string;
  href: string;
}

/** Which of the decorative animations are switched on. */
export interface SiteSettings {
  dancer: boolean;
  birds: boolean;
}

export interface ContactContent {
  lead: Localized;
  note: Localized;
  rows: ContactRow[];
}
