import type { Localized } from "./i18n";
import { ITALIC, PLAIN, type StyleMap, type TextStyle } from "./type-style";

/**
 * The written fields of a work and of a series, each with the face it wears
 * until the panel says otherwise -- the one place either list is kept, read
 * by the site to dress a row, by the save to know what to store and by the
 * panel to draw a row nothing has been chosen for yet.
 *
 * The year is the one field that starts with something to say: it has been
 * written slanted since long before it could be chosen, so a work saved then
 * must not straighten up on its own.
 */
export const WORK_STYLES = {
  title: PLAIN,
  caption: PLAIN,
  note: PLAIN,
  year: ITALIC,
} satisfies StyleMap<string>;

export const SERIES_STYLES = {
  title: PLAIN,
  meta: PLAIN,
  note: PLAIN,
  years: ITALIC,
} satisfies StyleMap<string>;

/**
 * The technique a work or a series is made in. The name is what the database
 * holds; what it is called in either language is answered by lib/dictionary.
 * A name added here has to be added to the CHECK the two tables carry as
 * well -- see the latest migration that rebuilds them.
 */
export const MEDIUMS = [
  "paintings",
  "prints",
  "paper",
  "collage",
  "photography",
  "sculpture",
  "ceramics",
  "textile",
  "installation",
  "video",
  "digital",
  "mixed",
] as const;

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
  /** The face each of its written fields is set in, the year among them. */
  styles: StyleMap<keyof typeof WORK_STYLES>;
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
  styles: StyleMap<keyof typeof SERIES_STYLES>;
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
  styles: StyleMap<"title" | "venue" | "kind" | "note">;
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
  style: TextStyle;
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
  style: TextStyle;
}

export interface AboutFact {
  label: Localized;
  /** One entry per line, typed as a small text area in the panel. */
  lines: Localized[];
  style: TextStyle;
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

/**
 * How far across the page something spreads. The four stops are named, not
 * measured: prose keeps a reading measure, a heading or a quote is display
 * type and goes by the eye, so each reads the same four words differently.
 */
export const WIDTHS = ["narrow", "medium", "wide", "full"] as const;

export type Width = (typeof WIDTHS)[number];

/** Where each of them starts before the panel says otherwise. */
export const DEFAULT_WIDTH = {
  heading: "full",
  quote: "wide",
  text: "wide",
} as const satisfies Record<"heading" | "quote" | "text", Width>;

/**
 * How big the words are set. Named like the widths and for the same reason:
 * "normal" is the size the page was drawn at, and each kind of text steps
 * away from its own normal.
 */
export const SIZES = ["small", "normal", "large", "huge"] as const;

export type Size = (typeof SIZES)[number];

export const DEFAULT_SIZE: Size = "normal";

export interface TextCell {
  kind: "text";
  paragraphs: Localized[];
  align: CellAlign;
  /** Across the column it was given; the alignment places what is left. */
  width: Width;
  size: Size;
  style: TextStyle;
}

export interface ImageCell {
  kind: "image";
  imageKey: string | null;
  /** Width over height, measured when the picture is uploaded. */
  ratio: number;
  caption: Localized;
  align: CellAlign;
  /** The face of the caption; the picture has no words of its own. */
  style: TextStyle;
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
  width: Width;
  /** Both the side of the page it keeps and the way the words are set. */
  align: Alignment;
  size: Size;
  style: TextStyle;
}

export interface QuoteBlock {
  type: "quote";
  quote: Localized;
  by: Localized;
  width: Width;
  align: Alignment;
  size: Size;
  /** The quote itself; the source line keeps the panel's small caps. */
  style: TextStyle;
}

/**
 * The participation list, standing wherever the artist puts it in the flow.
 * The lines themselves live in the cv tables; the block only says where the
 * list goes and what it is called.
 */
export interface CvBlock {
  type: "cv";
  /** The heading over the list; left empty the list runs without one. */
  title: Localized;
  style: TextStyle;
}

export const BLOCK_TYPES = ["row", "heading", "quote", "cv"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

/** The about page is a stream of these, in order. */
export type AboutBlock = RowBlock | HeadingBlock | QuoteBlock | CvBlock;

export interface AboutContent {
  lead: Localized;
  leadStyle: TextStyle;
  facts: AboutFact[];
  blocks: AboutBlock[];
  portraitSlot: Localized;
  portraitKey: string | null;
  /**
   * Set the first time the page is saved by a panel that knows the list is a
   * block of its own. Content saved before that has no such block and wants
   * one at the foot of the page; without the flag a list the artist took off
   * the page would simply come back.
   */
  cvPlaced?: boolean;
}

export interface ContactRow {
  label: Localized;
  value: string;
  href: string;
  style: TextStyle;
}

/** The contact page lists at most this many ways to reach her. */
export const MAX_CONTACT_ROWS = 8;

export interface ContactContent {
  lead: Localized;
  note: Localized;
  rows: ContactRow[];
  styles: StyleMap<"lead" | "note">;
}

export const HOME_ITEM_TYPES = ["work", "image"] as const;

export type HomeItemType = (typeof HOME_ITEM_TYPES)[number];

/** A slide showing a work the site already holds. */
export interface HomeWorkItem {
  type: "work";
  workId: string;
  /**
   * Leaves the slide as only its picture: the work's name, year and technique
   * are not written over it. The slide still leads to the work.
   */
  bare: boolean;
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
  /** Left blank together with the two below, nothing is written over it. */
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
  /**
   * One face for every slide, whatever it shows. A work keeps its own face
   * on its own pages; across the opening screens the names are set alike,
   * which is what makes a turning slideshow read as one thing.
   */
  styles: StyleMap<"title" | "caption">;
}
