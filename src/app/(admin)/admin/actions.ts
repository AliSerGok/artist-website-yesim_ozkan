"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { finish, stay } from "@/lib/flash";
import type { Localized } from "@/lib/i18n";
import {
  deleteCvEntry,
  deleteCvGroup,
  deleteExhibition,
  deleteSeries,
  deleteWork,
  reorderCvEntries,
  reorderCvGroups,
  reorderExhibitions,
  reorderSeries,
  reorderWorks,
  savePageContent,
  saveCvEntry,
  saveCvGroup,
  saveExhibition,
  saveSeries,
  saveWork,
} from "@/lib/admin-db";
import {
  getAbout,
  getExhibitionById,
  getHome,
  getSeriesById,
  getWorkById,
} from "@/lib/content";
import { deleteImages, orphaned } from "@/lib/media-store";
import {
  ALIGNMENTS,
  BLOCK_TYPES,
  CELL_TYPES,
  CV_KINDS,
  FLUSH,
  HOME_ITEM_TYPES,
  MAX_CELLS,
  MAX_CONTACT_ROWS,
  MEDIUMS,
  type AboutBlock,
  type AboutContent,
  type AboutFact,
  type Alignment,
  type BlockType,
  type CellAlign,
  type CellType,
  type ContactContent,
  type ContactRow,
  type CvKind,
  type HomeContent,
  type HomeItem,
  type HomeItemType,
  type Medium,
  type RowCell,
} from "@/lib/types";

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();

const number = (form: FormData, key: string, fallback: number) => {
  const value = Number(form.get(key));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
};

const flag = (form: FormData, key: string) => form.get(key) === "on";

/**
 * A reorder is the one action that arrives as an argument rather than a form:
 * the drag hands over the ids in the order the admin left them on screen. It
 * is a public endpoint like any other action, so take only strings from it.
 */
const idList = (value: unknown) =>
  Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];

const nullable = (form: FormData, key: string) => text(form, key) || null;

/** Every value posted under one name, in the order the page wrote them. */
const repeated = (form: FormData, key: string) =>
  form.getAll(key).map((value) => String(value));

const localized = (form: FormData, key: string) => ({
  tr: text(form, `${key}Tr`),
  en: text(form, `${key}En`) || text(form, `${key}Tr`),
});

function medium(form: FormData): Medium {
  const value = text(form, "medium");
  return (MEDIUMS as readonly string[]).includes(value)
    ? (value as Medium)
    : "paintings";
}

/* ---------------------------------------------------------------- works */

export async function saveWorkAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id") || null;

  return finish(
    "/admin/works",
    id ? "İş kaydedildi." : "Yeni iş eklendi.",
    async () => {
      const imageKey = nullable(form, "imageKey");
      const previous = id ? await getWorkById(id) : null;

      // A fresh upload reports its own size; otherwise keep whatever is set.
      const uploadedWidth = Number(form.get("imageWidth"));
      const uploadedHeight = Number(form.get("imageHeight"));
      const measured = uploadedWidth > 0 && uploadedHeight > 0;

      await saveWork({
        id,
        imageKey,
        medium: medium(form),
        seriesId: nullable(form, "seriesId"),
        year: text(form, "year"),
        titleTr: text(form, "titleTr"),
        titleEn: text(form, "titleEn") || text(form, "titleTr"),
        captionTr: text(form, "captionTr"),
        captionEn: text(form, "captionEn"),
        noteTr: text(form, "noteTr"),
        noteEn: text(form, "noteEn"),
        width: measured ? Math.round(uploadedWidth) : number(form, "width", 3),
        height: measured
          ? Math.round(uploadedHeight)
          : number(form, "height", 4),
        slot: text(form, "slot"),
        published: flag(form, "published"),
      });

      await deleteImages(orphaned([previous?.imageKey ?? null], [imageKey]));
    },
    id ? `/admin/works/${id}` : "/admin/works/new",
  );
}

/** Drops a work, and the picture nothing else was pointing at. */
async function removeWork(id: string) {
  const work = await getWorkById(id);
  await deleteWork(id);
  await deleteImages([work?.imageKey ?? null]);
}

/** From the work's own page, which cannot stay open on what is gone. */
export async function deleteWorkAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/works",
    "İş silindi.",
    () => removeWork(id),
    `/admin/works/${id}`,
  );
}

/** From the list, which stays put and comes back one row shorter. */
export async function deleteWorkRowAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return stay("İş silindi.", () => removeWork(id));
}

export async function reorderWorksAction(ids: unknown) {
  await requireAdmin();

  return stay("Sıra kaydedildi.", async () => {
    await reorderWorks(idList(ids));
    revalidatePath("/admin/works");
  });
}

/* --------------------------------------------------------------- series */

export async function saveSeriesAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id") || null;

  return finish(
    "/admin/series",
    id ? "Seri kaydedildi." : "Yeni seri eklendi.",
    async () => {
      await saveSeries({
        id,
        medium: medium(form),
        years: text(form, "years"),
        titleTr: text(form, "titleTr"),
        titleEn: text(form, "titleEn") || text(form, "titleTr"),
        metaTr: text(form, "metaTr"),
        metaEn: text(form, "metaEn"),
        noteTr: text(form, "noteTr"),
        noteEn: text(form, "noteEn"),
        coverWorkId: nullable(form, "coverWorkId"),
        published: flag(form, "published"),
      });
    },
    id ? `/admin/series/${id}` : "/admin/series/new",
  );
}

export async function deleteSeriesAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/series",
    "Seri silindi.",
    async () => {
      await deleteSeries(id);
    },
    `/admin/series/${id}`,
  );
}

/** From the list, which stays put and comes back one row shorter. */
export async function deleteSeriesRowAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return stay("Seri silindi.", () => deleteSeries(id));
}

/** How many pictures one drop onto a series may carry. */
const MAX_ADDED = 40;

/** The latest year a range names: "2023–2025" → "2025". */
function latestYear(years: string): string {
  const found = years.match(/\d{4}/g);
  return found?.[found.length - 1] ?? String(new Date().getFullYear());
}

/**
 * The pictures dropped onto a series page, each becoming a work of its own.
 * They arrive already stored — the panel uploads as they are picked — so this
 * only files them: under the series, in the order they were queued, with the
 * series' own technique and year to start from. Everything else is left for
 * the work's own page, which is where a title is written properly and a
 * picture is cropped.
 */
export async function addSeriesWorksAction(form: FormData) {
  await requireAdmin();

  const seriesId = text(form, "seriesId");
  const keys = repeated(form, "key").slice(0, MAX_ADDED);
  const widths = repeated(form, "width");
  const heights = repeated(form, "height");
  const titles = repeated(form, "title");

  return stay(
    keys.length === 1 ? "İş seriye eklendi." : `${keys.length} iş seriye eklendi.`,
    async () => {
      if (keys.length === 0) throw new Error("yüklenmiş görsel yok");

      const series = await getSeriesById(seriesId);
      if (!series) throw new Error("seri bulunamadı");

      const year = latestYear(series.years);

      // One at a time: each save reads the last sort order back, so the works
      // land in the queue's order rather than racing for the same slot.
      for (const [index, imageKey] of keys.entries()) {
        const title = (titles[index] ?? "").trim() || "Başlıksız";
        const width = Number(widths[index]);
        const height = Number(heights[index]);
        const measured = width > 0 && height > 0;

        await saveWork({
          id: null,
          imageKey,
          medium: series.medium,
          seriesId: series.id,
          year,
          titleTr: title,
          titleEn: title,
          captionTr: "",
          captionEn: "",
          noteTr: "",
          noteEn: "",
          width: measured ? Math.round(width) : 3,
          height: measured ? Math.round(height) : 4,
          slot: "",
          published: true,
        });
      }

      revalidatePath(`/admin/series/${series.id}`);
    },
  );
}

export async function reorderSeriesAction(ids: unknown) {
  await requireAdmin();

  return stay("Sıra kaydedildi.", async () => {
    await reorderSeries(idList(ids));
    revalidatePath("/admin/series");
  });
}

/* ---------------------------------------------------------- exhibitions */

export async function saveExhibitionAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id") || null;

  return finish(
    "/admin/exhibitions",
    id ? "Sergi kaydedildi." : "Yeni sergi eklendi.",
    async () => {
      const imageKey = nullable(form, "imageKey");
      const previous = id ? await getExhibitionById(id) : null;

      await saveExhibition({
        id,
        year: text(form, "year"),
        titleTr: text(form, "titleTr"),
        titleEn: text(form, "titleEn") || text(form, "titleTr"),
        venueTr: text(form, "venueTr"),
        venueEn: text(form, "venueEn") || text(form, "venueTr"),
        kindTr: text(form, "kindTr"),
        kindEn: text(form, "kindEn"),
        noteTr: text(form, "noteTr"),
        noteEn: text(form, "noteEn"),
        url: text(form, "url"),
        imageKey,
        published: flag(form, "published"),
      });

      await deleteImages(orphaned([previous?.imageKey ?? null], [imageKey]));
    },
    id ? `/admin/exhibitions/${id}` : "/admin/exhibitions/new",
  );
}

/** Drops a show, and the picture nothing else was pointing at. */
async function removeExhibition(id: string) {
  const exhibition = await getExhibitionById(id);
  await deleteExhibition(id);
  await deleteImages([exhibition?.imageKey ?? null]);
}

/** From the show's own page, which cannot stay open on what is gone. */
export async function deleteExhibitionAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/exhibitions",
    "Sergi silindi.",
    () => removeExhibition(id),
    `/admin/exhibitions/${id}`,
  );
}

/** From the list, which stays put and comes back one row shorter. */
export async function deleteExhibitionRowAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return stay("Sergi silindi.", () => removeExhibition(id));
}

export async function reorderExhibitionsAction(ids: unknown) {
  await requireAdmin();

  return stay("Sıra kaydedildi.", async () => {
    await reorderExhibitions(idList(ids));
    revalidatePath("/admin/exhibitions");
  });
}

/* ------------------------------------------------------------------- cv */

export async function saveCvAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id") || null;

  return finish(
    "/admin/cv",
    id ? "Satır kaydedildi." : "Yeni satır eklendi.",
    async () => {
      const kind = text(form, "kind");

      await saveCvEntry({
        id,
        groupId: nullable(form, "groupId"),
        year: text(form, "year"),
        titleTr: text(form, "titleTr"),
        titleEn: text(form, "titleEn") || text(form, "titleTr"),
        // Anything else means no tag at all, which is what a competition or
        // an award line wants.
        kind: (CV_KINDS as readonly string[]).includes(kind)
          ? (kind as CvKind)
          : "",
        url: text(form, "url"),
        published: flag(form, "published"),
      });
    },
    id ? `/admin/cv/${id}` : "/admin/cv/new",
  );
}

export async function deleteCvAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/cv",
    "Satır silindi.",
    async () => {
      await deleteCvEntry(id);
    },
    `/admin/cv/${id}`,
  );
}

/** From the list, which stays put and comes back one row shorter. */
export async function deleteCvRowAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return stay("Satır silindi.", () => deleteCvEntry(id));
}

export async function reorderCvAction(ids: unknown) {
  await requireAdmin();

  return stay("Sıra kaydedildi.", async () => {
    await reorderCvEntries(idList(ids));
    revalidatePath("/admin/cv");
  });
}

export async function saveCvGroupAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id") || null;

  return finish(
    "/admin/cv",
    id ? "Başlık kaydedildi." : "Yeni başlık eklendi.",
    async () => {
      await saveCvGroup({
        id,
        titleTr: text(form, "titleTr"),
        titleEn: text(form, "titleEn") || text(form, "titleTr"),
        published: flag(form, "published"),
      });
    },
    id ? `/admin/cv/groups/${id}` : "/admin/cv/groups/new",
  );
}

export async function deleteCvGroupAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/cv",
    "Başlık silindi.",
    async () => {
      await deleteCvGroup(id);
    },
    `/admin/cv/groups/${id}`,
  );
}

/** From the list. The lines under it are not deleted, only unfiled. */
export async function deleteCvGroupRowAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return stay("Başlık silindi.", () => deleteCvGroup(id));
}

export async function reorderCvGroupsAction(ids: unknown) {
  await requireAdmin();

  return stay("Sıra kaydedildi.", async () => {
    await reorderCvGroups(idList(ids));
    revalidatePath("/admin/cv");
  });
}

/* ---------------------------------------------------------------- pages */

/** Paragraphs are typed as one block of text, split on blank lines. */
function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Facts are typed one item per line. */
function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The two languages are typed side by side and line up by position. */
function pairUp(tr: string[], en: string[]): Localized[] {
  const length = Math.max(tr.length, en.length);
  return Array.from({ length }, (_, index) => ({
    tr: tr[index] ?? "",
    en: en[index] ?? tr[index] ?? "",
  }));
}

const blank = (): Localized => ({ tr: "", en: "" });

function emptyCell(kind: CellType): RowCell {
  return kind === "image"
    ? { kind, imageKey: null, ratio: 1.5, caption: blank(), align: FLUSH }
    : { kind: "text", paragraphs: [blank()], align: FLUSH };
}

/** One of the three stops, or the edge it started at. */
function alignment(form: FormData, key: string): Alignment {
  const value = text(form, key);
  return (ALIGNMENTS as readonly string[]).includes(value)
    ? (value as Alignment)
    : "start";
}

function emptyBlock(type: BlockType): AboutBlock {
  if (type === "heading") return { type, text: blank() };
  if (type === "quote") return { type, quote: blank(), by: blank() };
  return { type: "row", cells: [emptyCell("text")] };
}

/** Rebuilds the fact columns out of the indexed fields the form posts. */
function readFacts(form: FormData): AboutFact[] {
  const count = Number(form.get("factCount")) || 0;
  const facts: AboutFact[] = [];

  for (let index = 0; index < count; index += 1) {
    facts.push({
      label: localized(form, `factLabel${index}`),
      lines: pairUp(
        lines(text(form, `factLines${index}Tr`)),
        lines(text(form, `factLines${index}En`)),
      ),
    });
  }

  return facts;
}

/** Rebuilds the block list, strips and all, out of the posted fields. */
function readBlocks(form: FormData): AboutBlock[] {
  const count = Number(form.get("blockCount")) || 0;
  const blocks: AboutBlock[] = [];

  for (let index = 0; index < count; index += 1) {
    const at = (name: string) => `b${index}_${name}`;
    const type = String(form.get(at("type")) ?? "");
    if (!(BLOCK_TYPES as readonly string[]).includes(type)) continue;

    if (type === "heading") {
      blocks.push({ type: "heading", text: localized(form, at("head")) });
      continue;
    }

    if (type === "quote") {
      blocks.push({
        type: "quote",
        quote: localized(form, at("quote")),
        by: localized(form, at("by")),
      });
      continue;
    }

    const cellCount = Math.min(
      Number(form.get(at("cellCount"))) || 0,
      MAX_CELLS,
    );
    const cells: RowCell[] = [];

    for (let position = 0; position < cellCount; position += 1) {
      const on = (name: string) => `b${index}c${position}_${name}`;

      const align: CellAlign = {
        x: alignment(form, on("alignX")),
        y: alignment(form, on("alignY")),
      };

      if (String(form.get(on("kind"))) === "image") {
        cells.push({
          kind: "image",
          imageKey: nullable(form, on("imageKey")),
          ratio: Number(form.get(on("ratio"))) || 1.5,
          caption: localized(form, on("cap")),
          align,
        });
        continue;
      }

      cells.push({
        kind: "text",
        paragraphs: pairUp(
          paragraphs(text(form, on("textTr"))),
          paragraphs(text(form, on("textEn"))),
        ),
        align,
      });
    }

    // A strip with nothing left in it is not a block any more.
    if (cells.length > 0) blocks.push({ type: "row", cells });
  }

  return blocks;
}

function swap<T>(list: T[], index: number, direction: -1 | 1) {
  const to = index + direction;
  if (list[index] && list[to]) {
    [list[index], list[to]] = [list[to], list[index]];
  }
}

/**
 * One form, many submit buttons. Adding, reordering or dropping a block, a
 * field inside a strip, or a fact all post the whole form, so nothing typed
 * elsewhere is lost on the way.
 */
function applyIntent(
  intent: string,
  blocks: AboutBlock[],
  facts: AboutFact[],
): void {
  const [command, ...rest] = intent.split(":");
  const rowAt = (value: string) => {
    const block = blocks[Number(value)];
    return block?.type === "row" ? block : null;
  };

  if (command === "add") {
    if ((BLOCK_TYPES as readonly string[]).includes(rest[0])) {
      blocks.push(emptyBlock(rest[0] as BlockType));
    }
    return;
  }

  if (command === "delete") {
    blocks.splice(Number(rest[0]), 1);
    return;
  }

  if (command === "move") {
    swap(blocks, Number(rest[0]), rest[1] === "up" ? -1 : 1);
    return;
  }

  if (command === "cell-add") {
    const row = rowAt(rest[0]);
    if (
      row &&
      row.cells.length < MAX_CELLS &&
      (CELL_TYPES as readonly string[]).includes(rest[1])
    ) {
      row.cells.push(emptyCell(rest[1] as CellType));
    }
    return;
  }

  if (command === "cell-delete") {
    const row = rowAt(rest[0]);
    // The last field is what makes the strip a strip; it stays.
    if (row && row.cells.length > 1) row.cells.splice(Number(rest[1]), 1);
    return;
  }

  if (command === "cell-move") {
    const row = rowAt(rest[0]);
    if (row) swap(row.cells, Number(rest[1]), rest[2] === "left" ? -1 : 1);
    return;
  }

  if (command === "fact-add") {
    facts.push({ label: blank(), lines: [] });
    return;
  }

  if (command === "fact-delete") {
    facts.splice(Number(rest[0]), 1);
    return;
  }

  if (command === "fact-move") {
    swap(facts, Number(rest[0]), rest[1] === "up" ? -1 : 1);
  }
}

/** Which of the dozen buttons on the about form was pressed. */
function aboutNote(intent: string): string {
  const command = intent.split(":")[0];

  const notes: Record<string, string> = {
    add: "Blok eklendi.",
    delete: "Blok silindi.",
    move: "Blok taşındı.",
    "cell-add": "Alan eklendi.",
    "cell-delete": "Alan silindi.",
    "cell-move": "Alan taşındı.",
    "fact-add": "Künye sütunu eklendi.",
    "fact-delete": "Künye sütunu silindi.",
    "fact-move": "Künye sütunu taşındı.",
  };

  return notes[command] ?? "Hakkında sayfası kaydedildi.";
}

/** Every image a block points at, so orphans can be swept up after a save. */
function blockImages(blocks: AboutBlock[]): (string | null)[] {
  return blocks.flatMap((block) =>
    block.type === "row"
      ? block.cells.flatMap((cell) =>
          cell.kind === "image" ? [cell.imageKey] : [],
        )
      : [],
  );
}

export async function saveAboutAction(form: FormData) {
  await requireAdmin();

  const intent = text(form, "intent");

  return stay(aboutNote(intent), async () => {
    const previous = await getAbout();
    const blocks = readBlocks(form);
    const facts = readFacts(form);

    applyIntent(intent, blocks, facts);

    const portraitKey = nullable(form, "portraitKey");

    const about: AboutContent = {
      lead: localized(form, "lead"),
      facts,
      blocks,
      portraitSlot: localized(form, "portraitSlot"),
      portraitKey,
    };

    await savePageContent("about", about);

    await deleteImages(
      orphaned(
        [previous.portraitKey, ...blockImages(previous.blocks)],
        [portraitKey, ...blockImages(blocks)],
      ),
    );
  });
}

/** Rebuilds the rows out of the indexed fields the form posts. */
function readContactRows(form: FormData): ContactRow[] {
  const count = Math.min(
    Number(form.get("rowCount")) || 0,
    MAX_CONTACT_ROWS,
  );
  const rows: ContactRow[] = [];

  for (let index = 0; index < count; index += 1) {
    const labelTr = text(form, `rowLabelTr${index}`);
    rows.push({
      label: { tr: labelTr, en: text(form, `rowLabelEn${index}`) || labelTr },
      value: text(form, `rowValue${index}`),
      // "#" is the panel's way of saying a row points nowhere yet.
      href: text(form, `rowHref${index}`) || "#",
    });
  }

  return rows;
}

/**
 * Adding and removing a row post the whole form, so anything typed into the
 * other rows travels with the press and is saved rather than lost.
 */
function applyContactIntent(intent: string, rows: ContactRow[]): void {
  const [command, ...rest] = intent.split(":");

  if (command === "add" && rows.length < MAX_CONTACT_ROWS) {
    rows.push({ label: blank(), value: "", href: "" });
    return;
  }

  if (command === "delete") rows.splice(Number(rest[0]), 1);
}

/** Which of the buttons on the contact form was pressed. */
function contactNote(intent: string): string {
  const notes: Record<string, string> = {
    add: "Satır eklendi.",
    delete: "Satır silindi.",
  };

  return notes[intent.split(":")[0]] ?? "İletişim sayfası kaydedildi.";
}

export async function saveContactAction(form: FormData) {
  await requireAdmin();

  const intent = text(form, "intent");

  return stay(contactNote(intent), async () => {
    const rows = readContactRows(form);
    applyContactIntent(intent, rows);

    const contact: ContactContent = {
      lead: localized(form, "lead"),
      note: localized(form, "note"),
      rows,
    };

    await savePageContent("contact", contact);
  });
}

/* ----------------------------------------------------------------- home */

function emptyHomeItem(type: HomeItemType): HomeItem {
  return type === "work"
    ? { type: "work", workId: "" }
    : {
        type: "image",
        imageKey: null,
        ratio: 1.5,
        title: blank(),
        aside: blank(),
        caption: blank(),
        href: "",
      };
}

/** Rebuilds the slide list out of the indexed fields the form posts. */
function readHomeItems(form: FormData): HomeItem[] {
  const count = Number(form.get("itemCount")) || 0;
  const items: HomeItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const at = (name: string) => `h${index}_${name}`;
    const type = String(form.get(at("type")) ?? "");

    if (type === "blank") {
      items.push({ type: "blank" });
      continue;
    }

    if (type === "work") {
      items.push({ type: "work", workId: text(form, at("workId")) });
      continue;
    }

    if (type === "image") {
      items.push({
        type: "image",
        imageKey: nullable(form, at("imageKey")),
        ratio: Number(form.get(at("ratio"))) || 1.5,
        title: localized(form, at("title")),
        aside: localized(form, at("aside")),
        caption: localized(form, at("caption")),
        href: text(form, at("href")),
      });
    }
  }

  return items;
}

/** Same one-form-many-buttons arrangement the about page uses. */
function applyHomeIntent(intent: string, items: HomeItem[]): void {
  const [command, ...rest] = intent.split(":");

  // A new screen is two slots, both still waiting to be told what they hold.
  // The list is kept even, so this never disturbs a screen already there.
  if (command === "add" && rest[0] === "screen") {
    items.push({ type: "blank" }, { type: "blank" });
    return;
  }

  /* Tells a slot which kind of slide it is, leaving its place alone. */
  if (command === "set") {
    const index = Number(rest[0]);

    if (items[index] && (HOME_ITEM_TYPES as readonly string[]).includes(rest[1])) {
      items[index] = emptyHomeItem(rest[1] as HomeItemType);
    }
    return;
  }

  /*
   * Emptying a half leaves the half in place. Taking it out of the list
   * instead would re-pair every slide after it, which reads as though other
   * screens had been edited too.
   */
  if (command === "clear") {
    const index = Number(rest[0]);

    if (items[index]) items[index] = { type: "blank" };
    return;
  }

  /* Screens come and go whole, which is what keeps the pairing steady. */
  if (command === "delete" && rest[0] === "screen") {
    items.splice(Number(rest[1]) * 2, 2);
    return;
  }

  /*
   * A dragged screen takes both its halves with it. One that only had a half
   * is given an empty second on the way, so every screen after it keeps the
   * pairing the artist left it with.
   */
  if (command === "screens") {
    const count = Math.ceil(items.length / 2);
    const asked = [
      ...new Set(
        rest[0]
          .split(",")
          .map(Number)
          .filter((screen) => Number.isInteger(screen) && screen >= 0),
      ),
    ].filter((screen) => screen < count);

    // Anything short of the whole list is a garbled post, not a drag.
    if (asked.length !== count) return;

    const dragged = asked.flatMap((screen) => [
      items[screen * 2],
      items[screen * 2 + 1] ?? { type: "blank" as const },
    ]);
    items.splice(0, items.length, ...dragged);
    return;
  }

  if (command === "move") {
    swap(items, Number(rest[0]), rest[1] === "up" ? -1 : 1);
  }
}

function homeNote(intent: string): string {
  const notes: Record<string, string> = {
    "add:screen": "Ekran eklendi.",
    delete: "Ekran silindi.",
    clear: "Slayt kaldırıldı.",
    set: "Slayt seçildi.",
    move: "Slayt taşındı.",
    screens: "Ekran taşındı.",
  };

  return (
    notes[intent] ?? notes[intent.split(":")[0]] ?? "Ana sayfa kaydedildi."
  );
}

/** Every picture the slides point at, so orphans can be swept up on save. */
function homeImages(items: HomeItem[]): (string | null)[] {
  return items.flatMap((item) => (item.type === "image" ? [item.imageKey] : []));
}

export async function saveHomeAction(form: FormData) {
  await requireAdmin();

  const intent = text(form, "intent");

  return stay(homeNote(intent), async () => {
    const previous = await getHome();
    const items = readHomeItems(form);

    applyHomeIntent(intent, items);

    await savePageContent("home", { items } satisfies HomeContent);

    await deleteImages(
      orphaned(homeImages(previous.items), homeImages(items)),
    );
  });
}
