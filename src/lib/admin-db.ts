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

type Sortable = "works" | "exhibitions" | "series" | "cv_entries" | "cv_groups";

/** Nothing sane drags more than this; the rest is somebody poking the action. */
const MAX_REORDER = 500;

/**
 * Writes a whole list's order in one go, which is what a drag hands over.
 *
 * Only the rows named in `ids` are touched, and they keep the set of
 * `sort_order` values they already held between them — just handed out in the
 * new order. So a cv heading's lines can be dragged among themselves without
 * ever crossing into the heading above or below, and no other row moves.
 */
async function reorder(table: Sortable, ids: string[]): Promise<void> {
  const wanted = [...new Set(ids)].slice(0, MAX_REORDER);
  if (wanted.length < 2) return;

  const db = await requireDb();
  const holes = wanted.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT id, sort_order FROM ${table} WHERE id IN (${holes}) ORDER BY sort_order ASC`,
    )
    .bind(...wanted)
    .all<{ id: string; sort_order: number }>();

  const rows = results ?? [];
  const held = new Map(rows.map((row) => [row.id, row.sort_order]));
  // The slots this set of rows already occupies, lowest first. Seeded rows
  // can share a number; nudging each one past the last keeps the new order
  // sayable without disturbing anything above or below the set.
  const slots = rows.reduce<number[]>((kept, row, index) => {
    const last = kept[index - 1];
    kept.push(
      index === 0 ? row.sort_order : Math.max(row.sort_order, last + 1),
    );
    return kept;
  }, []);
  // A row the page named but the table no longer has is simply dropped, so a
  // list left open in another tab cannot resurrect it.
  const next = wanted.filter((id) => held.has(id));

  const writes = next
    .map((id, index) => ({ id, order: slots[index] }))
    .filter(({ id, order }) => held.get(id) !== order)
    .map(({ id, order }) =>
      db
        .prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`)
        .bind(order, id),
    );

  if (writes.length) await db.batch(writes);
}

export const reorderWorks = (ids: string[]) => reorder("works", ids);

export const reorderSeries = (ids: string[]) => reorder("series", ids);

export const reorderExhibitions = (ids: string[]) =>
  reorder("exhibitions", ids);

export const reorderCvGroups = (ids: string[]) => reorder("cv_groups", ids);

export const reorderCvEntries = (ids: string[]) => reorder("cv_entries", ids);

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

export interface CvGroupInput {
  id: string | null;
  titleTr: string;
  titleEn: string;
  published: boolean;
}

export async function saveCvGroup(input: CvGroupInput): Promise<string> {
  const db = await requireDb();

  if (input.id) {
    await db
      .prepare(
        `UPDATE cv_groups SET title_tr = ?, title_en = ?, published = ?,
           updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(input.titleTr, input.titleEn, input.published ? 1 : 0, input.id)
      .run();
    return input.id;
  }

  const id = newId("cvg");
  const last = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS max FROM cv_groups")
    .first<{ max: number }>();

  await db
    .prepare(
      `INSERT INTO cv_groups (id, sort_order, title_tr, title_en, published)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      (last?.max ?? 0) + 1,
      input.titleTr,
      input.titleEn,
      input.published ? 1 : 0,
    )
    .run();

  return id;
}

/** Deleting a heading keeps its lines; they come back as unfiled rows. */
export async function deleteCvGroup(id: string): Promise<void> {
  const db = await requireDb();
  await db.batch([
    db
      .prepare("UPDATE cv_entries SET group_id = NULL WHERE group_id = ?")
      .bind(id),
    db.prepare("DELETE FROM cv_groups WHERE id = ?").bind(id),
  ]);
}

export interface CvInput {
  id: string | null;
  groupId: string | null;
  year: string;
  titleTr: string;
  titleEn: string;
  kind: CvKind | "";
  url: string;
  published: boolean;
}

/** Lines are numbered within their heading, so a new one lands at its end. */
async function nextCvOrder(
  db: D1Database,
  groupId: string | null,
): Promise<number> {
  const last = await db
    .prepare(
      "SELECT COALESCE(MAX(sort_order), 0) AS max FROM cv_entries WHERE group_id IS ?",
    )
    .bind(groupId)
    .first<{ max: number }>();

  return (last?.max ?? 0) + 1;
}

export async function saveCvEntry(input: CvInput): Promise<string> {
  const db = await requireDb();

  if (input.id) {
    const current = await db
      .prepare("SELECT group_id, sort_order FROM cv_entries WHERE id = ?")
      .bind(input.id)
      .first<{ group_id: string | null; sort_order: number }>();

    // Moved to another heading: park it at the end of the new one rather than
    // wherever its old number happens to land.
    const order =
      current && current.group_id === input.groupId
        ? current.sort_order
        : await nextCvOrder(db, input.groupId);

    await db
      .prepare(
        `UPDATE cv_entries SET group_id = ?, sort_order = ?, year = ?,
           title_tr = ?, title_en = ?, kind = ?, url = ?, published = ?,
           updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        input.groupId,
        order,
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

  await db
    .prepare(
      `INSERT INTO cv_entries (id, group_id, year, sort_order, title_tr, title_en, kind, url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.groupId,
      input.year,
      await nextCvOrder(db, input.groupId),
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
  key: "home" | "about" | "contact",
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
