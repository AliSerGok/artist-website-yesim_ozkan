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

/** A sub-heading of the participation list, e.g. "Sergiler", "Yarışmalar". */
export interface CvGroup {
  id: string;
  /** Lower sorts first; headings move among themselves. */
  order: number;
  title: Localized;
  published: boolean;
}

/** One line of the complete participation list on the about page. */
export interface CvEntry {
  id: string;
  /** Heading the line sits under; loose lines run above the first heading. */
  groupId: string | null;
  year: string;
  /** Counted within its own heading, not across the whole list. */
  order: number;
  title: Localized;
  /** Empty where solo/group says nothing, e.g. a competition or an award. */
  kind: CvKind | "";
  url: string;
  published: boolean;
}

export interface AboutFact {
  label: Localized;
  /** One entry per line, typed as a small text area in the panel. */
  lines: Localized[];
}

export const CELL_TYPES = ["text", "image"] as const;

export type CellType = (typeof CELL_TYPES)[number];

/** The same three stops on both axes, named the way CSS names them. */
export const ALIGNMENTS = ["start", "center", "end"] as const;

export type Alignment = (typeof ALIGNMENTS)[number];

/** Where a field sits inside the column the strip gives it. */
export interface CellAlign {
  /** Across the column. */
  x: Alignment;
  /** Down the strip, against the tallest field standing beside it. */
  y: Alignment;
}

/** Top left, which is where every field sat before any of this. */
export const FLUSH: CellAlign = { x: "start", y: "start" };

export interface TextCell {
  kind: "text";
  paragraphs: Localized[];
  align: CellAlign;
}

export interface ImageCell {
  kind: "image";
  imageKey: string | null;
  /** Width over height, measured when the picture is uploaded. */
  ratio: number;
  caption: Localized;
  align: CellAlign;
}

export type RowCell = TextCell | ImageCell;

/** A strip holds at most this many fields side by side. */
export const MAX_CELLS = 3;

/**
 * One to three fields running across the page, each of them either prose or a
 * picture. A single text field reads at a comfortable measure; anything wider
 * becomes columns.
 */
export interface RowBlock {
  type: "row";
  cells: RowCell[];
}

/** A section heading in the flow, e.g. "Atölye", "Basında". */
export interface HeadingBlock {
  type: "heading";
  text: Localized;
}

export interface QuoteBlock {
  type: "quote";
  quote: Localized;
  by: Localized;
}

export const BLOCK_TYPES = ["row", "heading", "quote"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

/** The about page is a stream of these, in order. */
export type AboutBlock = RowBlock | HeadingBlock | QuoteBlock;

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

/** The contact page lists at most this many ways to reach her. */
export const MAX_CONTACT_ROWS = 8;

export interface ContactContent {
  lead: Localized;
  note: Localized;
  rows: ContactRow[];
}

export const HOME_ITEM_TYPES = ["work", "image"] as const;

export type HomeItemType = (typeof HOME_ITEM_TYPES)[number];

/** A slide showing a work the site already holds. */
export interface HomeWorkItem {
  type: "work";
  workId: string;
}

/**
 * A slide with a picture of its own — an exhibition view, a poster, the
 * studio — one that is not filed as a work anywhere else on the site.
 */
export interface HomeImageItem {
  type: "image";
  imageKey: string | null;
  /** Width over height, measured when the picture is uploaded. */
  ratio: number;
  title: Localized;
  /** The italic tail after the title: a year, a place, or nothing. */
  aside: Localized;
  /** The small line under the title. */
  caption: Localized;
  /** Where the slide leads; left empty it leads nowhere. */
  href: string;
}

/**
 * A slot on a screen that has been made but not yet told what it holds. The
 * panel shows it as a choice; the site passes over it, so the slide beside it
 * takes the whole screen until it is filled.
 */
export interface HomeBlankItem {
  type: "blank";
}

export type HomeItem = HomeWorkItem | HomeImageItem | HomeBlankItem;

/**
 * The home page: slides turning across the opening screen, two at a time.
 * Left empty, the site falls back to the first works on the grid, so the
 * page is never blank before the panel has been used.
 */
export interface HomeContent {
  items: HomeItem[];
}
