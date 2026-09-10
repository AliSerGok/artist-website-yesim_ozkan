"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteCvEntry,
  deleteExhibition,
  deleteSeries,
  deleteWork,
  moveCvEntry,
  moveExhibition,
  moveSeries,
  moveWork,
  savePageContent,
  saveCvEntry,
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
  CV_KINDS,
  MEDIUMS,
  type AboutBlock,
  type AboutContent,
  type BlockType,
  type ContactContent,
  type CvKind,
  type Medium,
  type SiteSettings,
} from "@/lib/types";

/** Drops every cached page so a save shows up on the site immediately. */
function purge() {
  revalidatePath("/", "layout");
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
    height: measured ? Math.round(uploadedHeight) : number(form, "height", 4),
    slot: text(form, "slot"),
    published: flag(form, "published"),
  });

  await deleteImages(orphaned([previous?.imageKey ?? null], [imageKey]));

  purge();
  redirect("/admin/works");
}

export async function deleteWorkAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const work = await getWorkById(id);
  await deleteWork(id);
  await deleteImages([work?.imageKey ?? null]);
  purge();
  redirect("/admin/works");
}

export async function moveWorkAction(form: FormData) {
  await requireAdmin();
  await moveWork(text(form, "id"), text(form, "direction") === "up" ? -1 : 1);
  purge();
  revalidatePath("/admin/works");
}

/* --------------------------------------------------------------- series */

export async function saveSeriesAction(form: FormData) {
  await requireAdmin();

  await saveSeries({
    id: text(form, "id") || null,
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

  purge();
  redirect("/admin/series");
}

export async function deleteSeriesAction(form: FormData) {
  await requireAdmin();
  await deleteSeries(text(form, "id"));
  purge();
  redirect("/admin/series");
}

export async function moveSeriesAction(form: FormData) {
  await requireAdmin();
  await moveSeries(text(form, "id"), text(form, "direction") === "up" ? -1 : 1);
  purge();
  revalidatePath("/admin/series");
}

/* ---------------------------------------------------------- exhibitions */

export async function saveExhibitionAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id") || null;
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

  purge();
  redirect("/admin/exhibitions");
}

export async function deleteExhibitionAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const exhibition = await getExhibitionById(id);
  await deleteExhibition(id);
  await deleteImages([exhibition?.imageKey ?? null]);
  purge();
  redirect("/admin/exhibitions");
}

export async function moveExhibitionAction(form: FormData) {
  await requireAdmin();
  await moveExhibition(
    text(form, "id"),
    text(form, "direction") === "up" ? -1 : 1,
  );
  purge();
  revalidatePath("/admin/exhibitions");
}

/* ------------------------------------------------------------------- cv */

export async function saveCvAction(form: FormData) {
  await requireAdmin();

  const kind = text(form, "kind");

  await saveCvEntry({
    id: text(form, "id") || null,
    year: text(form, "year"),
    titleTr: text(form, "titleTr"),
    titleEn: text(form, "titleEn") || text(form, "titleTr"),
    kind: (CV_KINDS as readonly string[]).includes(kind)
      ? (kind as CvKind)
      : "group",
    url: text(form, "url"),
    published: flag(form, "published"),
  });

  purge();
  redirect("/admin/cv");
}

export async function deleteCvAction(form: FormData) {
  await requireAdmin();
  await deleteCvEntry(text(form, "id"));
  purge();
  redirect("/admin/cv");
}

export async function moveCvAction(form: FormData) {
  await requireAdmin();
  await moveCvEntry(text(form, "id"), text(form, "direction") === "up" ? -1 : 1);
  purge();
  revalidatePath("/admin/cv");
}

/* ---------------------------------------------------------------- pages */

/** Paragraphs are typed as one block of text, split on blank lines. */
function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function emptyBlock(type: BlockType): AboutBlock {
  const blank = { tr: "", en: "" };
  if (type === "text") return { type, paragraphs: [{ ...blank }] };
  if (type === "quote") {
    return { type, quote: { ...blank }, by: { ...blank } };
  }
  if (type === "image") {
    return { type, imageKey: null, ratio: 1.5, caption: { ...blank } };
  }
  return {
    type,
    imageKeyA: null,
    ratioA: 0.8,
    imageKeyB: null,
    ratioB: 0.8,
    caption: { ...blank },
  };
}

/** Rebuilds the block list out of the indexed fields the form posts. */
function readBlocks(form: FormData): AboutBlock[] {
  const count = Number(form.get("blockCount")) || 0;
  const blocks: AboutBlock[] = [];

  for (let index = 0; index < count; index += 1) {
    const at = (name: string) => `b${index}_${name}`;
    const type = String(form.get(at("type")) ?? "");
    if (!(BLOCK_TYPES as readonly string[]).includes(type)) continue;

    if (type === "text") {
      const tr = paragraphs(text(form, at("textTr")));
      const en = paragraphs(text(form, at("textEn")));
      const length = Math.max(tr.length, en.length);
      blocks.push({
        type: "text",
        paragraphs: Array.from({ length }, (_, i) => ({
          tr: tr[i] ?? "",
          en: en[i] ?? tr[i] ?? "",
        })),
      });
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

    if (type === "image") {
      blocks.push({
        type: "image",
        imageKey: nullable(form, at("imageKey")),
        ratio: Number(form.get(at("ratio"))) || 1.5,
        caption: localized(form, at("cap")),
      });
      continue;
    }

    blocks.push({
      type: "pair",
      imageKeyA: nullable(form, at("imageKeyA")),
      ratioA: Number(form.get(at("ratioA"))) || 0.8,
      imageKeyB: nullable(form, at("imageKeyB")),
      ratioB: Number(form.get(at("ratioB"))) || 0.8,
      caption: localized(form, at("cap")),
    });
  }

  return blocks;
}

/** Every image a block points at, so orphans can be swept up after a save. */
function blockImages(blocks: AboutBlock[]): (string | null)[] {
  return blocks.flatMap((block) => {
    if (block.type === "image") return [block.imageKey];
    if (block.type === "pair") return [block.imageKeyA, block.imageKeyB];
    return [];
  });
}

export async function saveAboutAction(form: FormData) {
  await requireAdmin();

  const previous = await getAbout();
  const blocks = readBlocks(form);

  // One form, several submit buttons: add, reorder or drop a block without
  // losing whatever else was typed.
  const intent = text(form, "intent");
  const [command, argument] = intent.split(":");

  if (command === "add" && (BLOCK_TYPES as readonly string[]).includes(argument)) {
    blocks.push(emptyBlock(argument as BlockType));
  } else if (command === "delete") {
    blocks.splice(Number(argument), 1);
  } else if (command === "move") {
    const index = Number(argument);
    const to = intent.endsWith(":up") ? index - 1 : index + 1;
    if (blocks[index] && blocks[to]) {
      [blocks[index], blocks[to]] = [blocks[to], blocks[index]];
    }
  }

  const facts: AboutContent["facts"] = [];
  for (let index = 0; index < 4; index += 1) {
    const labelTr = text(form, `factLabelTr${index}`);
    const labelEn = text(form, `factLabelEn${index}`);
    if (!labelTr && !labelEn) continue;
    facts.push({
      label: { tr: labelTr, en: labelEn || labelTr },
      a: {
        tr: text(form, `factATr${index}`),
        en: text(form, `factAEn${index}`) || text(form, `factATr${index}`),
      },
      b: {
        tr: text(form, `factBTr${index}`),
        en: text(form, `factBEn${index}`) || text(form, `factBTr${index}`),
      },
    });
  }

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

  purge();
  redirect("/admin/pages/about");
}

/* -------------------------------------------------------------- settings */

export async function saveSettingsAction(form: FormData) {
  await requireAdmin();

  const settings: SiteSettings = {
    dancer: flag(form, "dancer"),
    birds: flag(form, "birds"),
  };

  await savePageContent("settings", settings);
  purge();
  redirect("/admin/settings");
}

export async function saveContactAction(form: FormData) {
  await requireAdmin();

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
  purge();
  redirect("/admin/pages/contact");
}
