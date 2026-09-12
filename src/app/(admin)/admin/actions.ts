"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import type { Localized } from "@/lib/i18n";
import {
  deleteCvEntry,
  deleteCvGroup,
  deleteExhibition,
  deleteSeries,
  deleteWork,
  moveCvEntry,
  moveCvGroup,
  moveExhibition,
  moveSeries,
  moveWork,
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
  getWorkById,
} from "@/lib/content";
import { deleteImages, orphaned } from "@/lib/media-store";
import {
  BLOCK_TYPES,
  CELL_TYPES,
  CV_KINDS,
  MAX_CELLS,
  MEDIUMS,
  type AboutBlock,
  type AboutContent,
  type AboutFact,
  type BlockType,
  type CellType,
  type ContactContent,
  type CvKind,
  type Medium,
  type RowCell,
  type SiteSettings,
} from "@/lib/types";

/** Drops every cached page so a save shows up on the site immediately. */
function purge() {
  revalidatePath("/", "layout");
}

/** Carries a line for the panel's toast bar through the redirect. */
function noted(to: string, note: string, tone: "ok" | "err" = "ok") {
  const query = new URLSearchParams({
    toast: note,
    tone,
    // Two identical saves in a row still have to look different in the
    // address bar, or the second one is never announced.
    n: Date.now().toString(36),
  });
  return `${to}?${query}`;
}

/**
 * Runs a mutation and then leaves with something to say. When it goes wrong
 * the admin lands back on `back` with the reason on screen, rather than on a
 * blank error page.
 */
async function finish(
  to: string,
  note: string,
  work: () => Promise<void>,
  back = to,
): Promise<never> {
  let failure: string | null = null;

  try {
    await work();
    purge();
  } catch (cause) {
    console.error(cause);
    failure = cause instanceof Error ? cause.message : "bilinmeyen bir hata";
  }

  // redirect() throws to unwind, so it is kept out of the try above.
  redirect(
    failure
      ? noted(back, `Olmadı — ${failure}`, "err")
      : noted(to, note),
  );
}

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();

const number = (form: FormData, key: string, fallback: number) => {
  const value = Number(form.get(key));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
};

const flag = (form: FormData, key: string) => form.get(key) === "on";

const nullable = (form: FormData, key: string) => text(form, key) || null;

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

export async function deleteWorkAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/works",
    "İş silindi.",
    async () => {
      const work = await getWorkById(id);
      await deleteWork(id);
      await deleteImages([work?.imageKey ?? null]);
    },
    `/admin/works/${id}`,
  );
}

export async function moveWorkAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/works", "Sıra değişti.", async () => {
    await moveWork(text(form, "id"), text(form, "direction") === "up" ? -1 : 1);
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

export async function moveSeriesAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/series", "Sıra değişti.", async () => {
    await moveSeries(
      text(form, "id"),
      text(form, "direction") === "up" ? -1 : 1,
    );
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

export async function deleteExhibitionAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");

  return finish(
    "/admin/exhibitions",
    "Sergi silindi.",
    async () => {
      const exhibition = await getExhibitionById(id);
      await deleteExhibition(id);
      await deleteImages([exhibition?.imageKey ?? null]);
    },
    `/admin/exhibitions/${id}`,
  );
}

export async function moveExhibitionAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/exhibitions", "Sıra değişti.", async () => {
    await moveExhibition(
      text(form, "id"),
      text(form, "direction") === "up" ? -1 : 1,
    );
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

export async function moveCvAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/cv", "Sıra değişti.", async () => {
    await moveCvEntry(
      text(form, "id"),
      text(form, "direction") === "up" ? -1 : 1,
    );
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

export async function moveCvGroupAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/cv", "Sıra değişti.", async () => {
    await moveCvGroup(
      text(form, "id"),
      text(form, "direction") === "up" ? -1 : 1,
    );
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
    ? { kind, imageKey: null, ratio: 1.5, caption: blank() }
    : { kind: "text", paragraphs: [blank()] };
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

      if (String(form.get(on("kind"))) === "image") {
        cells.push({
          kind: "image",
          imageKey: nullable(form, on("imageKey")),
          ratio: Number(form.get(on("ratio"))) || 1.5,
          caption: localized(form, on("cap")),
        });
        continue;
      }

      cells.push({
        kind: "text",
        paragraphs: pairUp(
          paragraphs(text(form, on("textTr"))),
          paragraphs(text(form, on("textEn"))),
        ),
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

  return finish("/admin/pages/about", aboutNote(intent), async () => {
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

/* -------------------------------------------------------------- settings */

export async function saveSettingsAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/settings", "Animasyon ayarları kaydedildi.", async () => {
    const settings: SiteSettings = {
      dancer: flag(form, "dancer"),
      birds: flag(form, "birds"),
    };

    await savePageContent("settings", settings);
  });
}

export async function saveContactAction(form: FormData) {
  await requireAdmin();

  return finish("/admin/pages/contact", "İletişim sayfası kaydedildi.", async () => {
    const rows: ContactContent["rows"] = [];
    for (let index = 0; index < 6; index += 1) {
      const value = text(form, `rowValue${index}`);
      const labelTr = text(form, `rowLabelTr${index}`);
      if (!value && !labelTr) continue;
      rows.push({
        label: { tr: labelTr, en: text(form, `rowLabelEn${index}`) || labelTr },
        value,
        href: text(form, `rowHref${index}`) || "#",
      });
    }

    const contact: ContactContent = {
      lead: localized(form, "lead"),
      note: localized(form, "note"),
      rows,
    };

    await savePageContent("contact", contact);
  });
}
