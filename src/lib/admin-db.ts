import { getDb } from "./db";
import { slugify } from "./slug";
import type { CvKind, Medium } from "./types";

async function requireDb(): Promise<D1Database> {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Veritabanı bağlı değil. `npm run db:migrate:local` çalıştırın.",
    );
  }
  return db;
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 12)}`;
}

/** Appends a counter until the slug is free within its table. */
async function uniqueSlug(
  db: D1Database,
  table: "works" | "series",
  base: string,
  ignoreId: string | null,
): Promise<string> {
  const root = slugify(base) || "isim-yok";
  let candidate = root;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const clash = await db
      .prepare(`SELECT id FROM ${table} WHERE slug = ? AND id IS NOT ?`)
      .bind(candidate, ignoreId)
      .first<{ id: string }>();
    if (!clash) return candidate;
    candidate = `${root}-${suffix}`;
  }

  return `${root}-${Date.now()}`;
}

/* ---------------------------------------------------------------- works */

export interface WorkInput {
  id: string | null;
  imageKey: string | null;
  medium: Medium;
  seriesId: string | null;
  year: string;
  titleTr: string;
  titleEn: string;
  captionTr: string;
  captionEn: string;
  noteTr: string;
  noteEn: string;
  width: number;
  height: number;
  slot: string;
  published: boolean;
}

export async function saveWork(input: WorkInput): Promise<string> {
  const db = await requireDb();
  const slug = await uniqueSlug(
    db,
    "works",
    input.titleTr || input.titleEn,
    input.id,
  );

  if (input.id) {
    await db
      .prepare(
        `UPDATE works SET slug = ?, image_key = ?, medium = ?, series_id = ?, year = ?,
           title_tr = ?, title_en = ?, caption_tr = ?, caption_en = ?,
           note_tr = ?, note_en = ?, width = ?, height = ?, slot = ?,
           published = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        slug,
        input.imageKey,
        input.medium,
        input.seriesId,
        input.year,
        input.titleTr,
        input.titleEn,
        input.captionTr,
        input.captionEn,
        input.noteTr,
        input.noteEn,
        input.width,
        input.height,
        input.slot,
        input.published ? 1 : 0,
        input.id,
      )
      .run();
    return input.id;
  }

  const id = newId("w");
  const last = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS max FROM works")
    .first<{ max: number }>();

  await db
    .prepare(
      `INSERT INTO works (id, slug, image_key, medium, series_id, year, sort_order,
         title_tr, title_en, caption_tr, caption_en, note_tr, note_en,
         width, height, slot, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      slug,
      input.imageKey,
      input.medium,
      input.seriesId,
      input.year,
      (last?.max ?? 0) + 1,
      input.titleTr,
      input.titleEn,
      input.captionTr,
      input.captionEn,
      input.noteTr,
      input.noteEn,
      input.width,
      input.height,
      input.slot,
      input.published ? 1 : 0,
    )
    .run();

  return id;
}

export async function deleteWork(id: string): Promise<void> {
  const db = await requireDb();
  await db.batch([
    // Never leave a series pointing at a work that no longer exists.
    db
      .prepare("UPDATE series SET cover_work_id = NULL WHERE cover_work_id = ?")
      .bind(id),
    db.prepare("DELETE FROM works WHERE id = ?").bind(id),
  ]);
}

export async function setWorkImage(
  id: string,
  imageKey: string | null,
  width?: number,
  height?: number,
): Promise<void> {
  const db = await requireDb();
  if (width && height) {
    await db
      .prepare(
        "UPDATE works SET image_key = ?, width = ?, height = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .bind(imageKey, width, height, id)
      .run();
    return;
  }
  await db
    .prepare(
      "UPDATE works SET image_key = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(imageKey, id)
    .run();
}

/* --------------------------------------------------------------- series */

export interface SeriesInput {
  id: string | null;
  medium: Medium;
  years: string;
  titleTr: string;
  titleEn: string;
  metaTr: string;
  metaEn: string;
  noteTr: string;
  noteEn: string;
  coverWorkId: string | null;
  published: boolean;
}

export async function saveSeries(input: SeriesInput): Promise<string> {
  const db = await requireDb();
  const slug = await uniqueSlug(
    db,
    "series",
    input.titleTr || input.titleEn,
    input.id,
  );

  if (input.id) {
    await db
      .prepare(
        `UPDATE series SET slug = ?, medium = ?, years = ?, title_tr = ?,
           title_en = ?, meta_tr = ?, meta_en = ?, note_tr = ?, note_en = ?,
           cover_work_id = ?, published = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        slug,
        input.medium,
        input.years,
        input.titleTr,
        input.titleEn,
        input.metaTr,
        input.metaEn,
        input.noteTr,
        input.noteEn,
        input.coverWorkId,
        input.published ? 1 : 0,
        input.id,
      )
      .run();
    return input.id;
  }

  const id = newId("s");
  const last = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS max FROM series")
    .first<{ max: number }>();

  await db
    .prepare(
      `INSERT INTO series (id, slug, medium, years, sort_order, title_tr,
         title_en, meta_tr, meta_en, note_tr, note_en, cover_work_id, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      slug,
      input.medium,
      input.years,
      (last?.max ?? 0) + 1,
      input.titleTr,
      input.titleEn,
      input.metaTr,
      input.metaEn,
      input.noteTr,
      input.noteEn,
      input.coverWorkId,
      input.published ? 1 : 0,
    )
    .run();

  return id;
}

/** Deleting a series keeps its works; they return to the main grid. */
export async function deleteSeries(id: string): Promise<void> {
  const db = await requireDb();
  await db.batch([
    db.prepare("UPDATE works SET series_id = NULL WHERE series_id = ?").bind(id),
    db.prepare("DELETE FROM series WHERE id = ?").bind(id),
  ]);
}

/* -------------------------------------------------------------- ordering */

/** Swaps a row with its neighbour so the artist can reorder the grid. */
async function move(
  table: "works" | "exhibitions" | "series" | "cv_entries",
  id: string,
  direction: -1 | 1,
): Promise<void> {
  const db = await requireDb();
  const current = await db
    .prepare(`SELECT id, sort_order FROM ${table} WHERE id = ?`)
    .bind(id)
    .first<{ id: string; sort_order: number }>();
  if (!current) return;

  const neighbour = await db
    .prepare(
      direction === -1
        ? `SELECT id, sort_order FROM ${table} WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1`
        : `SELECT id, sort_order FROM ${table} WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1`,
    )
    .bind(current.sort_order)
    .first<{ id: string; sort_order: number }>();
  if (!neighbour) return;

  await db.batch([
    db
      .prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`)
      .bind(neighbour.sort_order, current.id),
    db
      .prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`)
      .bind(current.sort_order, neighbour.id),
  ]);
}

export const moveWork = (id: string, direction: -1 | 1) =>
  move("works", id, direction);

export const moveSeries = (id: string, direction: -1 | 1) =>
  move("series", id, direction);

export const moveExhibition = (id: string, direction: -1 | 1) =>
  move("exhibitions", id, direction);

export const moveCvEntry = (id: string, direction: -1 | 1) =>
  move("cv_entries", id, direction);

/* ---------------------------------------------------------- exhibitions */

export interface ExhibitionInput {
  id: string | null;
  year: string;
  titleTr: string;
  titleEn: string;
  venueTr: string;
  venueEn: string;
  kindTr: string;
  kindEn: string;
  noteTr: string;
  noteEn: string;
  url: string;
  imageKey: string | null;
  published: boolean;
}

export async function saveExhibition(input: ExhibitionInput): Promise<string> {
  const db = await requireDb();

  if (input.id) {
    await db
      .prepare(
        `UPDATE exhibitions SET year = ?, title_tr = ?, title_en = ?, venue_tr = ?,
           venue_en = ?, kind_tr = ?, kind_en = ?, note_tr = ?, note_en = ?,
           url = ?, image_key = ?, published = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        input.year,
        input.titleTr,
        input.titleEn,
        input.venueTr,
        input.venueEn,
        input.kindTr,
        input.kindEn,
        input.noteTr,
        input.noteEn,
        input.url,
        input.imageKey,
        input.published ? 1 : 0,
        input.id,
      )
      .run();
    return input.id;
  }

  const id = newId("e");
  const last = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS max FROM exhibitions")
    .first<{ max: number }>();

  await db
    .prepare(
      `INSERT INTO exhibitions (id, year, sort_order, title_tr, title_en,
         venue_tr, venue_en, kind_tr, kind_en, note_tr, note_en, url,
         image_key, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.year,
      (last?.max ?? 0) + 1,
      input.titleTr,
      input.titleEn,
      input.venueTr,
      input.venueEn,
      input.kindTr,
      input.kindEn,
      input.noteTr,
      input.noteEn,
      input.url,
      input.imageKey,
      input.published ? 1 : 0,
    )
    .run();

  return id;
}

export async function deleteExhibition(id: string): Promise<void> {
  const db = await requireDb();
  await db.prepare("DELETE FROM exhibitions WHERE id = ?").bind(id).run();
}

/* ------------------------------------------------------------------- cv */

export interface CvInput {
  id: string | null;
  year: string;
  titleTr: string;
  titleEn: string;
  kind: CvKind;
  url: string;
  published: boolean;
}

export async function saveCvEntry(input: CvInput): Promise<string> {
  const db = await requireDb();

  if (input.id) {
    await db
      .prepare(
        `UPDATE cv_entries SET year = ?, title_tr = ?, title_en = ?, kind = ?,
           url = ?, published = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        input.year,
        input.titleTr,
        input.titleEn,
        input.kind,
        input.url,
        input.published ? 1 : 0,
        input.id,
      )
      .run();
    return input.id;
  }

  const id = newId("cv");
  const last = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS max FROM cv_entries")
    .first<{ max: number }>();

  await db
    .prepare(
      `INSERT INTO cv_entries (id, year, sort_order, title_tr, title_en, kind, url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.year,
      (last?.max ?? 0) + 1,
      input.titleTr,
      input.titleEn,
      input.kind,
      input.url,
      input.published ? 1 : 0,
    )
    .run();

  return id;
}

export async function deleteCvEntry(id: string): Promise<void> {
  const db = await requireDb();
  await db.prepare("DELETE FROM cv_entries WHERE id = ?").bind(id).run();
}

/* ---------------------------------------------------------------- pages */

export async function savePageContent(
  key: "about" | "contact",
  data: unknown,
): Promise<void> {
  const db = await requireDb();
  await db
    .prepare(
      `INSERT INTO pages (key, data, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    )
    .bind(key, JSON.stringify(data))
    .run();
}
