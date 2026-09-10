import { getDb } from "./db";
import {
  SEED_ABOUT,
  SEED_CONTACT,
  SEED_CV,
  SEED_EXHIBITIONS,
  SEED_SERIES,
  SEED_WORKS,
} from "./seed";
import type {
  AboutContent,
  ContactContent,
  CvEntry,
  CvKind,
  Exhibition,
  Medium,
  Series,
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
  year: string;
  sort_order: number;
  title_tr: string;
  title_en: string;
  kind: string;
  url: string;
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
    year: row.year,
    order: row.sort_order,
    title: { tr: row.title_tr, en: row.title_en },
    kind: row.kind as CvKind,
    url: row.url,
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

async function getPage<T>(key: "about" | "contact", fallback: T): Promise<T> {
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

export async function getAbout(): Promise<AboutContent> {
  const about = await getPage("about", SEED_ABOUT);
  // Older saves kept the body as a flat list of paragraphs.
  return Array.isArray(about.blocks)
    ? about
    : { ...about, blocks: SEED_ABOUT.blocks };
}

/* ------------------------------------------------------------------- cv */

export async function getCvEntries(): Promise<CvEntry[]> {
  const db = await getDb();
  if (!db) return SEED_CV.filter((entry) => entry.published).sort(byOrder);

  const { results } = await db
    .prepare(
      "SELECT * FROM cv_entries WHERE published = 1 ORDER BY sort_order ASC",
    )
    .all<CvRow>();

  return results.map(toCvEntry);
}

export async function getAllCvEntries(): Promise<CvEntry[]> {
  const db = await getDb();
  if (!db) return [...SEED_CV].sort(byOrder);

  const { results } = await db
    .prepare("SELECT * FROM cv_entries ORDER BY sort_order ASC")
    .all<CvRow>();

  return results.map(toCvEntry);
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

export async function getContact(): Promise<ContactContent> {
  return getPage("contact", SEED_CONTACT);
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
