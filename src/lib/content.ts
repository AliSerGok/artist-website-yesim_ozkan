import { getDb } from "./db";
import { defaultCvTitle } from "./dictionary";
import type { Localized } from "./i18n";
import {
  SEED_ABOUT,
  SEED_CONTACT,
  SEED_CV,
  SEED_CV_GROUPS,
  SEED_EXHIBITIONS,
  SEED_HOME,
  SEED_SERIES,
  SEED_WORKS,
} from "./seed";
import type { TypePageKey } from "./page-type";
import {
  PLAIN,
  plainMap,
  toStyle,
  toStyleMap,
  type StyleMap,
  type TextStyle,
} from "./type-style";
import {
  CV_STYLES,
  DEFAULT_SIZE,
  DEFAULT_WIDTH,
  EXHIBITION_STYLES,
  FLUSH,
  HOME_STYLES,
  SERIES_STYLES,
  WORK_STYLES,
} from "./types";
import type {
  AboutBlock,
  AboutContent,
  AboutFact,
  Alignment,
  ContactContent,
  CvEntry,
  CvGroup,
  Exhibition,
  HomeContent,
  HomeImageItem,
  HomeItem,
  ImageCell,
  Medium,
  RowCell,
  Series,
  Size,
  TextCell,
  Width,
  Work,
} from "./types";

/**
 * The one set of faces a kind of row is written in, read against what that
 * kind wears when nothing has been chosen yet. Kept in the pages table, so
 * it is fetched once per request and handed to every row it dresses rather
 * than stored beside each of them -- see lib/page-type.
 */
async function pageStyles<Role extends string>(
  key: TypePageKey,
  defaults: StyleMap<Role>,
): Promise<StyleMap<Role>> {
  const page = await getPage<{ styles?: unknown }>(key, {});
  return toStyleMap(page.styles, defaults);
}

export const getWorkStyles = () => pageStyles("works", WORK_STYLES);
export const getSeriesStyles = () => pageStyles("series", SERIES_STYLES);
export const getExhibitionStyles = () =>
  pageStyles("exhibitions", EXHIBITION_STYLES);
export const getCvStyles = () => pageStyles("cv", CV_STYLES);

/**
 * Single place the pages read content from. Falls back to the seed data
 * when no D1 binding is present, so `next dev` works before setup.
 */

interface WorkRow {
  id: string;
  slug: string;
  medium: string;
  series_id: string | null;
  year: string;
  sort_order: number;
  title_tr: string;
  title_en: string;
  caption_tr: string;
  caption_en: string;
  note_tr: string;
  note_en: string;
  width: number;
  height: number;
  slot: string;
  image_key: string | null;
  published: number;
}

interface SeriesRow {
  id: string;
  slug: string;
  medium: string;
  years: string;
  sort_order: number;
  title_tr: string;
  title_en: string;
  meta_tr: string;
  meta_en: string;
  note_tr: string;
  note_en: string;
  cover_work_id: string | null;
  show_titles: number;
  published: number;
}

interface ExhibitionRow {
  id: string;
  year: string;
  sort_order: number;
  title_tr: string;
  title_en: string;
  venue_tr: string;
  venue_en: string;
  kind_tr: string;
  kind_en: string;
  note_tr: string;
  note_en: string;
  url: string;
  image_key: string | null;
  published: number;
}

interface CvRow {
  id: string;
  group_id: string | null;
  year: string;
  sort_order: number;
  title_tr: string;
  title_en: string;
  kind: string;
  url: string;
  published: number;
}

interface CvGroupRow {
  id: string;
  sort_order: number;
  title_tr: string;
  title_en: string;
  published: number;
}

function toWork(row: WorkRow, styles: Work["styles"]): Work {
  return {
    id: row.id,
    slug: row.slug,
    medium: row.medium as Medium,
    seriesId: row.series_id,
    year: row.year,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    caption: { tr: row.caption_tr, en: row.caption_en },
    note: { tr: row.note_tr, en: row.note_en },
    width: row.width,
    height: row.height,
    slot: row.slot,
    imageKey: row.image_key,
    published: row.published === 1,
    styles,
  };
}

function toSeries(row: SeriesRow, styles: Series["styles"]): Series {
  return {
    id: row.id,
    slug: row.slug,
    medium: row.medium as Medium,
    years: row.years,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    meta: { tr: row.meta_tr, en: row.meta_en },
    note: { tr: row.note_tr, en: row.note_en },
    coverWorkId: row.cover_work_id,
    showTitles: row.show_titles === 1,
    published: row.published === 1,
    styles,
  };
}

function toExhibition(
  row: ExhibitionRow,
  styles: Exhibition["styles"],
): Exhibition {
  return {
    id: row.id,
    year: row.year,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    venue: { tr: row.venue_tr, en: row.venue_en },
    kind: { tr: row.kind_tr, en: row.kind_en },
    note: { tr: row.note_tr, en: row.note_en },
    url: row.url,
    imageKey: row.image_key,
    published: row.published === 1,
    styles,
  };
}

function toCvEntry(row: CvRow, style: TextStyle): CvEntry {
  return {
    id: row.id,
    groupId: row.group_id,
    year: row.year,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    kind: row.kind as CvEntry["kind"],
    url: row.url,
    published: row.published === 1,
    style,
  };
}

function toCvGroup(row: CvGroupRow, style: TextStyle): CvGroup {
  return {
    id: row.id,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    published: row.published === 1,
    style,
  };
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const seedWorks = () => SEED_WORKS.filter((w) => w.published).sort(byOrder);
const seedSeries = () => SEED_SERIES.filter((s) => s.published).sort(byOrder);

/* ---------------------------------------------------------------- works */

export async function getWorks(): Promise<Work[]> {
  const db = await getDb();
  if (!db) return seedWorks();

  const [{ results }, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM works WHERE published = 1 ORDER BY sort_order ASC")
      .all<WorkRow>(),
    getWorkStyles(),
  ]);

  return results.map((row) => toWork(row, styles));
}

/** Works that stand on their own — series members live on the series page. */
export async function getSingleWorks(): Promise<Work[]> {
  return (await getWorks()).filter((work) => work.seriesId === null);
}

export async function getWorksInSeries(seriesId: string): Promise<Work[]> {
  return (await getWorks()).filter((work) => work.seriesId === seriesId);
}

export async function getWork(slug: string): Promise<Work | null> {
  const db = await getDb();
  if (!db) return seedWorks().find((work) => work.slug === slug) ?? null;

  const [row, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM works WHERE slug = ? AND published = 1")
      .bind(slug)
      .first<WorkRow>(),
    getWorkStyles(),
  ]);

  return row ? toWork(row, styles) : null;
}

/* --------------------------------------------------------------- series */

export async function getSeriesList(): Promise<Series[]> {
  const db = await getDb();
  if (!db) return seedSeries();

  const [{ results }, styles] = await Promise.all([
    db
      .prepare(
        "SELECT * FROM series WHERE published = 1 ORDER BY sort_order ASC",
      )
      .all<SeriesRow>(),
    getSeriesStyles(),
  ]);

  return results.map((row) => toSeries(row, styles));
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const db = await getDb();
  if (!db) return seedSeries().find((series) => series.slug === slug) ?? null;

  const [row, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM series WHERE slug = ? AND published = 1")
      .bind(slug)
      .first<SeriesRow>(),
    getSeriesStyles(),
  ]);

  return row ? toSeries(row, styles) : null;
}

/* ---------------------------------------------------------- exhibitions */

export async function getExhibitions(): Promise<Exhibition[]> {
  const db = await getDb();
  if (!db) return [...SEED_EXHIBITIONS].sort(byOrder);

  const [{ results }, styles] = await Promise.all([
    db
      .prepare(
        "SELECT * FROM exhibitions WHERE published = 1 ORDER BY sort_order ASC",
      )
      .all<ExhibitionRow>(),
    getExhibitionStyles(),
  ]);

  return results.map((row) => toExhibition(row, styles));
}

/* ---------------------------------------------------------------- pages */

async function getPage<T>(
  key: "home" | "about" | "contact" | TypePageKey,
  fallback: T,
): Promise<T> {
  const db = await getDb();
  if (!db) return fallback;

  const row = await db
    .prepare("SELECT data FROM pages WHERE key = ?")
    .bind(key)
    .first<{ data: string }>();

  if (!row) return fallback;

  try {
    return JSON.parse(row.data) as T;
  } catch {
    return fallback;
  }
}

/** How many works stand in before any slide has been chosen in the panel. */
const HOME_FALLBACK = 6;

/**
 * Only the panel writes these rows, so the shape is trusted; what is checked
 * is that the slide still says which kind it is. A slide left unfinished —
 * no work picked, no picture uploaded — is kept for the panel to go on
 * showing, and skipped by the page below.
 */
function toHomeItem(item: HomeItem): HomeItem | null {
  if (item?.type === "blank") {
    return { type: "blank" };
  }

  if (item?.type === "work") {
    return { type: "work", workId: item.workId ?? "", bare: !!item.bare };
  }

  if (item?.type === "image") {
    return {
      ...item,
      imageKey: item.imageKey ?? null,
      ratio: item.ratio > 0 ? item.ratio : 1.5,
      title: item.title ?? blank(),
      aside: item.aside ?? blank(),
      caption: item.caption ?? blank(),
      href: item.href ?? "",
    };
  }

  return null;
}

export async function getHome(): Promise<HomeContent> {
  const home = await getPage<HomeContent>("home", SEED_HOME);
  const items = Array.isArray(home.items) ? home.items : [];

  const kept = items
    .map(toHomeItem)
    .filter((item): item is HomeItem => item !== null);

  /*
   * Screens are pairs, so an odd list leaves a half standing open. Giving it
   * a blank keeps every screen whole, which is what lets a slide be taken out
   * without re-pairing all the slides after it. The site skips blanks, so a
   * screen filled on one side still goes out as one picture, full width.
   */
  if (kept.length % 2 === 1) kept.push({ type: "blank" });

  return {
    items: kept,
    styles: toStyleMap(home.styles, HOME_STYLES),
  };
}

/** A slide together with whatever it takes to draw it. */
export type HomeEntry =
  | {
      type: "work";
      work: Work;
      /**
       * The series the work belongs to, when it belongs to one that is still
       * published. The home page needs the slug, not the id: a slide leading
       * into a series opens the series page under the viewer.
       */
      seriesSlug: string | null;
      /** The panel asked for the picture alone, with nothing written on it. */
      bare: boolean;
    }
  | { type: "image"; item: HomeImageItem };

/**
 * The slides the home page turns through, in the order the panel put them in.
 * A slide with nothing to show — a picture not uploaded yet, a work not
 * picked, or one since unpublished or deleted — drops out silently; the panel
 * keeps it either way.
 * If nothing is left, the works at the head of the grid stand in, so the
 * opening screen is never empty.
 */
/** What one screen actually shows: two slides, or one filling it on its own. */
export type HomeScreen = HomeEntry[];

/** Cuts a flat list into the screens it makes, two slots at a time. */
function byTwos<T>(items: T[]): T[][] {
  const pairs: T[][] = [];

  for (let index = 0; index < items.length; index += 2) {
    pairs.push(items.slice(index, index + 2));
  }

  return pairs;
}

export async function getHomeScreens(): Promise<HomeScreen[]> {
  const [home, works, series] = await Promise.all([
    getHome(),
    getWorks(),
    getSeriesList(),
  ]);

  /* A work whose series has been unpublished stands on its own again. */
  const seriesSlug = (work: Work) =>
    series.find((item) => item.id === work.seriesId)?.slug ?? null;

  const drawable = (item: HomeItem): HomeEntry | null => {
    if (item.type === "image") {
      return item.imageKey ? { type: "image", item } : null;
    }
    // A slot whose kind has not been picked yet has nothing to draw.
    if (item.type !== "work") return null;

    const work = works.find((candidate) => candidate.id === item.workId);
    return work
      ? { type: "work", work, seriesSlug: seriesSlug(work), bare: item.bare }
      : null;
  };

  /*
   * Empty halves are dropped inside the screen they belong to, never across
   * screens. Flattening the whole list first and pairing it up again would
   * close the gap by pulling the next screen's first picture into it.
   */
  const screens = byTwos(home.items)
    .map((slots) =>
      slots
        .map(drawable)
        .filter((entry): entry is HomeEntry => entry !== null),
    )
    .filter((screen) => screen.length > 0);

  if (screens.length > 0) return screens;

  // Nothing arranged yet: the first works stand in, two to a screen.
  return byTwos(
    works.slice(0, HOME_FALLBACK).map((work) => ({
      type: "work" as const,
      work,
      seriesSlug: seriesSlug(work),
      bare: false,
    })),
  );
}

/*
 * Shapes the about page used to be saved in. The editor now writes one kind of
 * block -- a strip of up to three fields -- so anything stored before that is
 * translated on the way out rather than migrated in place.
 */
interface LegacyFact {
  style?: unknown;
  label?: Localized;
  a?: Localized;
  b?: Localized;
  lines?: Localized[];
}

type LegacyCell =
  | (Omit<TextCell, "align" | "width" | "size" | "style"> &
      Partial<Pick<TextCell, "align" | "width" | "size" | "style">>)
  | (Omit<ImageCell, "align" | "style"> &
      Partial<Pick<ImageCell, "align" | "style">>);

interface LegacyBlock {
  type?: string;
  paragraphs?: Localized[];
  cells?: LegacyCell[];
  text?: Localized;
  title?: Localized;
  width?: Width;
  align?: Alignment;
  size?: Size;
  style?: unknown;
  quote?: Localized;
  by?: Localized;
  imageKey?: string | null;
  ratio?: number;
  caption?: Localized;
  imageKeyA?: string | null;
  ratioA?: number;
  imageKeyB?: string | null;
  ratioB?: number;
}

const blank = (): Localized => ({ tr: "", en: "" });

/**
 * A field saved before the panel could align them stays where it sat, and
 * one saved before it could set a measure keeps the only one there was.
 */
const toCell = (cell: LegacyCell): RowCell =>
  cell.kind === "text"
    ? {
        ...cell,
        align: cell.align ?? FLUSH,
        width: cell.width ?? DEFAULT_WIDTH.text,
        size: cell.size ?? DEFAULT_SIZE,
        style: toStyle(cell.style),
      }
    : { ...cell, align: cell.align ?? FLUSH, style: toStyle(cell.style) };

function toFact(fact: LegacyFact): AboutFact {
  return {
    style: toStyle(fact.style),
    label: fact.label ?? blank(),
    // The two fixed lines became a list the artist can extend.
    lines:
      fact.lines ?? [fact.a, fact.b].filter((line): line is Localized => !!line),
  };
}

function toBlock(block: LegacyBlock): AboutBlock | null {
  if (block.type === "row" && Array.isArray(block.cells)) {
    return { type: "row", cells: block.cells.map(toCell) };
  }

  if (block.type === "heading") {
    return {
      type: "heading",
      text: block.text ?? blank(),
      width: block.width ?? DEFAULT_WIDTH.heading,
      align: block.align ?? "start",
      size: block.size ?? DEFAULT_SIZE,
      style: toStyle(block.style),
    };
  }

  if (block.type === "quote") {
    return {
      type: "quote",
      quote: block.quote ?? blank(),
      by: block.by ?? blank(),
      // Quotes were set to a narrow measure before this was a choice; the
      // wider default is the one they are read at now.
      width: block.width ?? DEFAULT_WIDTH.quote,
      align: block.align ?? "start",
      size: block.size ?? DEFAULT_SIZE,
      style: toStyle(block.style),
    };
  }

  if (block.type === "cv") {
    return {
      type: "cv",
      title: block.title ?? defaultCvTitle(),
      style: toStyle(block.style),
    };
  }

  if (block.type === "text") {
    return {
      type: "row",
      cells: [
        {
          kind: "text",
          paragraphs: block.paragraphs ?? [],
          align: FLUSH,
          width: DEFAULT_WIDTH.text,
          size: DEFAULT_SIZE,
          style: PLAIN,
        },
      ],
    };
  }

  if (block.type === "image") {
    return {
      type: "row",
      cells: [
        {
          kind: "image",
          imageKey: block.imageKey ?? null,
          ratio: block.ratio ?? 1.5,
          caption: block.caption ?? blank(),
          align: FLUSH,
          style: PLAIN,
        },
      ],
    };
  }

  if (block.type === "pair") {
    return {
      type: "row",
      cells: [
        {
          kind: "image",
          imageKey: block.imageKeyA ?? null,
          ratio: block.ratioA ?? 0.8,
          // A pair shared one caption; it belongs to the picture it described.
          caption: block.caption ?? blank(),
          align: FLUSH,
          style: PLAIN,
        },
        {
          kind: "image",
          imageKey: block.imageKeyB ?? null,
          ratio: block.ratioB ?? 0.8,
          caption: blank(),
          align: FLUSH,
          style: PLAIN,
        },
      ],
    };
  }

  return null;
}

/**
 * The participation list used to be nailed to the foot of the page. Content
 * saved before it became a block gets one there, so nothing moves until the
 * panel says so; once the panel has saved the page, a page without the block
 * is a page the artist took the list off, and it stays off. A second list
 * would only repeat the first, so it is dropped either way.
 */
function placeCvBlock(blocks: AboutBlock[], saved: boolean): AboutBlock[] {
  let found = false;

  const kept = blocks.filter((block) => {
    if (block.type !== "cv") return true;
    if (found) return false;
    found = true;
    return true;
  });

  if (found || saved) return kept;

  return [...kept, { type: "cv", title: defaultCvTitle(), style: PLAIN }];
}

export async function getAbout(): Promise<AboutContent> {
  const about = await getPage<AboutContent>("about", SEED_ABOUT);

  return {
    ...about,
    leadStyle: toStyle(about.leadStyle),
    facts: Array.isArray(about.facts)
      ? (about.facts as LegacyFact[]).map(toFact)
      : SEED_ABOUT.facts,
    blocks: placeCvBlock(
      Array.isArray(about.blocks)
        ? (about.blocks as LegacyBlock[])
            .map(toBlock)
            .filter((block): block is AboutBlock => block !== null)
        : SEED_ABOUT.blocks,
      about.cvPlaced === true,
    ),
  };
}

/* ------------------------------------------------------------------- cv */

export async function getCvEntries(): Promise<CvEntry[]> {
  const db = await getDb();
  if (!db) return SEED_CV.filter((entry) => entry.published);

  const [{ results }, styles] = await Promise.all([
    db
      .prepare(
        "SELECT * FROM cv_entries WHERE published = 1 ORDER BY sort_order ASC",
      )
      .all<CvRow>(),
    getCvStyles(),
  ]);

  return results.map((row) => toCvEntry(row, styles.entry));
}

export async function getCvGroups(): Promise<CvGroup[]> {
  const db = await getDb();
  if (!db) return SEED_CV_GROUPS.filter((group) => group.published);

  const [{ results }, styles] = await Promise.all([
    db
      .prepare(
        "SELECT * FROM cv_groups WHERE published = 1 ORDER BY sort_order ASC",
      )
      .all<CvGroupRow>(),
    getCvStyles(),
  ]);

  return results.map((row) => toCvGroup(row, styles.group));
}

/** One heading of the participation list together with the lines under it. */
export interface CvSection {
  /** Null for lines written before any heading existed. */
  group: CvGroup | null;
  entries: CvEntry[];
}

/**
 * The participation list the way the about page reads it: loose lines first,
 * then each heading in its own order. A heading with no lines is a heading
 * still being filled in, so the site leaves it out; hiding a heading hides
 * its lines with it.
 */
export async function getCvSections(): Promise<CvSection[]> {
  const [groups, entries] = await Promise.all([getCvGroups(), getCvEntries()]);

  const under = (groupId: string | null) =>
    entries
      .filter((entry) => entry.groupId === groupId)
      .sort(byOrder);

  const loose = under(null);
  const sections: CvSection[] = loose.length > 0 ? [{ group: null, entries: loose }] : [];

  for (const group of [...groups].sort(byOrder)) {
    const members = under(group.id);
    if (members.length > 0) sections.push({ group, entries: members });
  }

  return sections;
}

export async function getAllCvEntries(): Promise<CvEntry[]> {
  const db = await getDb();
  if (!db) return [...SEED_CV];

  const [{ results }, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM cv_entries ORDER BY sort_order ASC")
      .all<CvRow>(),
    getCvStyles(),
  ]);

  return results.map((row) => toCvEntry(row, styles.entry));
}

export async function getAllCvGroups(): Promise<CvGroup[]> {
  const db = await getDb();
  if (!db) return [...SEED_CV_GROUPS].sort(byOrder);

  const [{ results }, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM cv_groups ORDER BY sort_order ASC")
      .all<CvGroupRow>(),
    getCvStyles(),
  ]);

  return results.map((row) => toCvGroup(row, styles.group));
}

export async function getCvEntryById(id: string): Promise<CvEntry | null> {
  const db = await getDb();
  if (!db) return SEED_CV.find((entry) => entry.id === id) ?? null;

  const [row, styles] = await Promise.all([
    db.prepare("SELECT * FROM cv_entries WHERE id = ?").bind(id).first<CvRow>(),
    getCvStyles(),
  ]);

  return row ? toCvEntry(row, styles.entry) : null;
}

export async function getCvGroupById(id: string): Promise<CvGroup | null> {
  const db = await getDb();
  if (!db) return SEED_CV_GROUPS.find((group) => group.id === id) ?? null;

  const [row, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM cv_groups WHERE id = ?")
      .bind(id)
      .first<CvGroupRow>(),
    getCvStyles(),
  ]);

  return row ? toCvGroup(row, styles.group) : null;
}

export async function getContact(): Promise<ContactContent> {
  const contact = await getPage<ContactContent>("contact", SEED_CONTACT);

  return {
    ...contact,
    // The rows of the list are written alike, so the face is the page's.
    styles: toStyleMap(
      contact.styles,
      plainMap(["lead", "note", "row"] as const),
    ),
    // Rebuilt rather than passed through, so a face left over from when each
    // row chose its own does not ride along in the shape.
    rows: (Array.isArray(contact.rows) ? contact.rows : []).map(
      ({ label, value, href }) => ({ label, value, href }),
    ),
  };
}

/* ---------------------------------------------------------------- admin */
/* These include drafts and are only read by the admin panel. */

export async function getAllWorks(): Promise<Work[]> {
  const db = await getDb();
  if (!db) return [...SEED_WORKS].sort(byOrder);

  const [{ results }, styles] = await Promise.all([
    db.prepare("SELECT * FROM works ORDER BY sort_order ASC").all<WorkRow>(),
    getWorkStyles(),
  ]);

  return results.map((row) => toWork(row, styles));
}

export async function getAllExhibitions(): Promise<Exhibition[]> {
  const db = await getDb();
  if (!db) return [...SEED_EXHIBITIONS].sort(byOrder);

  const [{ results }, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM exhibitions ORDER BY sort_order ASC")
      .all<ExhibitionRow>(),
    getExhibitionStyles(),
  ]);

  return results.map((row) => toExhibition(row, styles));
}

export async function getAllSeries(): Promise<Series[]> {
  const db = await getDb();
  if (!db) return [...SEED_SERIES].sort(byOrder);

  const [{ results }, styles] = await Promise.all([
    db.prepare("SELECT * FROM series ORDER BY sort_order ASC").all<SeriesRow>(),
    getSeriesStyles(),
  ]);

  return results.map((row) => toSeries(row, styles));
}

export async function getWorkById(id: string): Promise<Work | null> {
  const db = await getDb();
  if (!db) return SEED_WORKS.find((work) => work.id === id) ?? null;

  const [row, styles] = await Promise.all([
    db.prepare("SELECT * FROM works WHERE id = ?").bind(id).first<WorkRow>(),
    getWorkStyles(),
  ]);

  return row ? toWork(row, styles) : null;
}

export async function getSeriesById(id: string): Promise<Series | null> {
  const db = await getDb();
  if (!db) return SEED_SERIES.find((series) => series.id === id) ?? null;

  const [row, styles] = await Promise.all([
    db.prepare("SELECT * FROM series WHERE id = ?").bind(id).first<SeriesRow>(),
    getSeriesStyles(),
  ]);

  return row ? toSeries(row, styles) : null;
}

export async function getExhibitionById(id: string): Promise<Exhibition | null> {
  const db = await getDb();
  if (!db) return SEED_EXHIBITIONS.find((item) => item.id === id) ?? null;

  const [row, styles] = await Promise.all([
    db
      .prepare("SELECT * FROM exhibitions WHERE id = ?")
      .bind(id)
      .first<ExhibitionRow>(),
    getExhibitionStyles(),
  ]);

  return row ? toExhibition(row, styles) : null;
}
