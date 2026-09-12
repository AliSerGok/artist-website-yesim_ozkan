import { getDb } from "./db";
import type { Localized } from "./i18n";
import {
  SEED_ABOUT,
  SEED_CONTACT,
  SEED_CV,
  SEED_CV_GROUPS,
  SEED_EXHIBITIONS,
  SEED_SERIES,
  SEED_SETTINGS,
  SEED_WORKS,
} from "./seed";
import type {
  AboutBlock,
  AboutContent,
  AboutFact,
  ContactContent,
  CvEntry,
  CvGroup,
  Exhibition,
  Medium,
  RowCell,
  Series,
  SiteSettings,
  Work,
} from "./types";

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

function toWork(row: WorkRow): Work {
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
  };
}

function toSeries(row: SeriesRow): Series {
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
    published: row.published === 1,
  };
}

function toExhibition(row: ExhibitionRow): Exhibition {
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
  };
}

function toCvEntry(row: CvRow): CvEntry {
  return {
    id: row.id,
    groupId: row.group_id,
    year: row.year,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    kind: row.kind as CvEntry["kind"],
    url: row.url,
    published: row.published === 1,
  };
}

function toCvGroup(row: CvGroupRow): CvGroup {
  return {
    id: row.id,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    published: row.published === 1,
  };
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const seedWorks = () => SEED_WORKS.filter((w) => w.published).sort(byOrder);
const seedSeries = () => SEED_SERIES.filter((s) => s.published).sort(byOrder);

/* ---------------------------------------------------------------- works */

export async function getWorks(): Promise<Work[]> {
  const db = await getDb();
  if (!db) return seedWorks();

  const { results } = await db
    .prepare("SELECT * FROM works WHERE published = 1 ORDER BY sort_order ASC")
    .all<WorkRow>();

  return results.map(toWork);
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

  const row = await db
    .prepare("SELECT * FROM works WHERE slug = ? AND published = 1")
    .bind(slug)
    .first<WorkRow>();

  return row ? toWork(row) : null;
}

/* --------------------------------------------------------------- series */

export async function getSeriesList(): Promise<Series[]> {
  const db = await getDb();
  if (!db) return seedSeries();

  const { results } = await db
    .prepare("SELECT * FROM series WHERE published = 1 ORDER BY sort_order ASC")
    .all<SeriesRow>();

  return results.map(toSeries);
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const db = await getDb();
  if (!db) return seedSeries().find((series) => series.slug === slug) ?? null;

  const row = await db
    .prepare("SELECT * FROM series WHERE slug = ? AND published = 1")
    .bind(slug)
    .first<SeriesRow>();

  return row ? toSeries(row) : null;
}

/* ---------------------------------------------------------- exhibitions */

export async function getExhibitions(): Promise<Exhibition[]> {
  const db = await getDb();
  if (!db) return [...SEED_EXHIBITIONS].sort(byOrder);

  const { results } = await db
    .prepare(
      "SELECT * FROM exhibitions WHERE published = 1 ORDER BY sort_order ASC",
    )
    .all<ExhibitionRow>();

  return results.map(toExhibition);
}

/* ---------------------------------------------------------------- pages */

async function getPage<T>(
  key: "about" | "contact" | "settings",
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

/*
 * Shapes the about page used to be saved in. The editor now writes one kind of
 * block -- a strip of up to three fields -- so anything stored before that is
 * translated on the way out rather than migrated in place.
 */
interface LegacyFact {
  label?: Localized;
  a?: Localized;
  b?: Localized;
  lines?: Localized[];
}

interface LegacyBlock {
  type?: string;
  paragraphs?: Localized[];
  cells?: RowCell[];
  text?: Localized;
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

function toFact(fact: LegacyFact): AboutFact {
  return {
    label: fact.label ?? blank(),
    // The two fixed lines became a list the artist can extend.
    lines:
      fact.lines ?? [fact.a, fact.b].filter((line): line is Localized => !!line),
  };
}

function toBlock(block: LegacyBlock): AboutBlock | null {
  if (block.type === "row" && Array.isArray(block.cells)) {
    return { type: "row", cells: block.cells };
  }

  if (block.type === "heading") {
    return { type: "heading", text: block.text ?? blank() };
  }

  if (block.type === "quote") {
    return {
      type: "quote",
      quote: block.quote ?? blank(),
      by: block.by ?? blank(),
    };
  }

  if (block.type === "text") {
    return {
      type: "row",
      cells: [{ kind: "text", paragraphs: block.paragraphs ?? [] }],
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
        },
        {
          kind: "image",
          imageKey: block.imageKeyB ?? null,
          ratio: block.ratioB ?? 0.8,
          caption: blank(),
        },
      ],
    };
  }

  return null;
}

export async function getAbout(): Promise<AboutContent> {
  const about = await getPage<AboutContent>("about", SEED_ABOUT);

  return {
    ...about,
    facts: Array.isArray(about.facts)
      ? (about.facts as LegacyFact[]).map(toFact)
      : SEED_ABOUT.facts,
    blocks: Array.isArray(about.blocks)
      ? (about.blocks as LegacyBlock[])
          .map(toBlock)
          .filter((block): block is AboutBlock => block !== null)
      : SEED_ABOUT.blocks,
  };
}

/* ------------------------------------------------------------------- cv */

export async function getCvEntries(): Promise<CvEntry[]> {
  const db = await getDb();
  if (!db) return SEED_CV.filter((entry) => entry.published);

  const { results } = await db
    .prepare(
      "SELECT * FROM cv_entries WHERE published = 1 ORDER BY sort_order ASC",
    )
    .all<CvRow>();

  return results.map(toCvEntry);
}

export async function getCvGroups(): Promise<CvGroup[]> {
  const db = await getDb();
  if (!db) return SEED_CV_GROUPS.filter((group) => group.published);

  const { results } = await db
    .prepare("SELECT * FROM cv_groups WHERE published = 1 ORDER BY sort_order ASC")
    .all<CvGroupRow>();

  return results.map(toCvGroup);
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

  const { results } = await db
    .prepare("SELECT * FROM cv_entries ORDER BY sort_order ASC")
    .all<CvRow>();

  return results.map(toCvEntry);
}

export async function getAllCvGroups(): Promise<CvGroup[]> {
  const db = await getDb();
  if (!db) return [...SEED_CV_GROUPS].sort(byOrder);

  const { results } = await db
    .prepare("SELECT * FROM cv_groups ORDER BY sort_order ASC")
    .all<CvGroupRow>();

  return results.map(toCvGroup);
}

export async function getCvEntryById(id: string): Promise<CvEntry | null> {
  const db = await getDb();
  if (!db) return SEED_CV.find((entry) => entry.id === id) ?? null;

  const row = await db
    .prepare("SELECT * FROM cv_entries WHERE id = ?")
    .bind(id)
    .first<CvRow>();

  return row ? toCvEntry(row) : null;
}

export async function getCvGroupById(id: string): Promise<CvGroup | null> {
  const db = await getDb();
  if (!db) return SEED_CV_GROUPS.find((group) => group.id === id) ?? null;

  const row = await db
    .prepare("SELECT * FROM cv_groups WHERE id = ?")
    .bind(id)
    .first<CvGroupRow>();

  return row ? toCvGroup(row) : null;
}

export async function getContact(): Promise<ContactContent> {
  return getPage("contact", SEED_CONTACT);
}

export async function getSettings(): Promise<SiteSettings> {
  const stored = await getPage<Partial<SiteSettings>>("settings", {});
  return { ...SEED_SETTINGS, ...stored };
}

/* ---------------------------------------------------------------- admin */
/* These include drafts and are only read by the admin panel. */

export async function getAllWorks(): Promise<Work[]> {
  const db = await getDb();
  if (!db) return [...SEED_WORKS].sort(byOrder);

  const { results } = await db
    .prepare("SELECT * FROM works ORDER BY sort_order ASC")
    .all<WorkRow>();

  return results.map(toWork);
}

export async function getAllExhibitions(): Promise<Exhibition[]> {
  const db = await getDb();
  if (!db) return [...SEED_EXHIBITIONS].sort(byOrder);

  const { results } = await db
    .prepare("SELECT * FROM exhibitions ORDER BY sort_order ASC")
    .all<ExhibitionRow>();

  return results.map(toExhibition);
}

export async function getAllSeries(): Promise<Series[]> {
  const db = await getDb();
  if (!db) return [...SEED_SERIES].sort(byOrder);

  const { results } = await db
    .prepare("SELECT * FROM series ORDER BY sort_order ASC")
    .all<SeriesRow>();

  return results.map(toSeries);
}

export async function getWorkById(id: string): Promise<Work | null> {
  const db = await getDb();
  if (!db) return SEED_WORKS.find((work) => work.id === id) ?? null;

  const row = await db
    .prepare("SELECT * FROM works WHERE id = ?")
    .bind(id)
    .first<WorkRow>();

  return row ? toWork(row) : null;
}

export async function getSeriesById(id: string): Promise<Series | null> {
  const db = await getDb();
  if (!db) return SEED_SERIES.find((series) => series.id === id) ?? null;

  const row = await db
    .prepare("SELECT * FROM series WHERE id = ?")
    .bind(id)
    .first<SeriesRow>();

  return row ? toSeries(row) : null;
}

export async function getExhibitionById(id: string): Promise<Exhibition | null> {
  const db = await getDb();
  if (!db) return SEED_EXHIBITIONS.find((item) => item.id === id) ?? null;

  const row = await db
    .prepare("SELECT * FROM exhibitions WHERE id = ?")
    .bind(id)
    .first<ExhibitionRow>();

  return row ? toExhibition(row) : null;
}
