"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteExhibition,
  deleteSeries,
  deleteWork,
  moveExhibition,
  moveSeries,
  moveWork,
  savePageContent,
  saveExhibition,
  saveSeries,
  saveWork,
  setWorkImage,
} from "@/lib/admin-db";
import { MEDIUMS, type Medium } from "@/lib/types";
import type { AboutContent, ContactContent } from "@/lib/types";

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

function medium(form: FormData): Medium {
  const value = text(form, "medium");
  return (MEDIUMS as readonly string[]).includes(value)
    ? (value as Medium)
    : "paintings";
}

/* ---------------------------------------------------------------- works */

export async function saveWorkAction(form: FormData) {
  await requireAdmin();

  await saveWork({
    id: text(form, "id") || null,
    medium: medium(form),
    seriesId: text(form, "seriesId") || null,
    year: text(form, "year"),
    titleTr: text(form, "titleTr"),
    titleEn: text(form, "titleEn") || text(form, "titleTr"),
    captionTr: text(form, "captionTr"),
    captionEn: text(form, "captionEn"),
    noteTr: text(form, "noteTr"),
    noteEn: text(form, "noteEn"),
    width: number(form, "width", 3),
    height: number(form, "height", 4),
    slot: text(form, "slot"),
    published: flag(form, "published"),
  });

  purge();
  redirect("/admin/works");
}

export async function deleteWorkAction(form: FormData) {
  await requireAdmin();
  await deleteWork(text(form, "id"));
  purge();
  redirect("/admin/works");
}

export async function moveWorkAction(form: FormData) {
  await requireAdmin();
  await moveWork(text(form, "id"), text(form, "direction") === "up" ? -1 : 1);
  purge();
  revalidatePath("/admin/works");
}

export async function setWorkImageAction(form: FormData) {
  await requireAdmin();
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  await setWorkImage(
    text(form, "id"),
    text(form, "imageKey") || null,
    Number.isFinite(width) ? width : undefined,
    Number.isFinite(height) ? height : undefined,
  );
  purge();
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
    coverWorkId: text(form, "coverWorkId") || null,
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

  await saveExhibition({
    id: text(form, "id") || null,
    year: text(form, "year"),
    titleTr: text(form, "titleTr"),
    titleEn: text(form, "titleEn") || text(form, "titleTr"),
    venueTr: text(form, "venueTr"),
    venueEn: text(form, "venueEn") || text(form, "venueTr"),
    kindTr: text(form, "kindTr"),
    kindEn: text(form, "kindEn"),
    published: flag(form, "published"),
  });

  purge();
  redirect("/admin/exhibitions");
}

export async function deleteExhibitionAction(form: FormData) {
  await requireAdmin();
  await deleteExhibition(text(form, "id"));
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

/* ---------------------------------------------------------------- pages */

/** Paragraphs are typed as one block of text, split on blank lines. */
function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function saveAboutAction(form: FormData) {
  await requireAdmin();

  const trParagraphs = paragraphs(text(form, "paragraphsTr"));
  const enParagraphs = paragraphs(text(form, "paragraphsEn"));
  const count = Math.max(trParagraphs.length, enParagraphs.length);

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

  const about: AboutContent = {
    lead: { tr: text(form, "leadTr"), en: text(form, "leadEn") },
    paragraphs: Array.from({ length: count }, (_, index) => ({
      tr: trParagraphs[index] ?? "",
      en: enParagraphs[index] ?? "",
    })),
    facts,
    portraitSlot: {
      tr: text(form, "portraitSlotTr"),
      en: text(form, "portraitSlotEn"),
    },
    portraitKey: text(form, "portraitKey") || null,
  };

  await savePageContent("about", about);
  purge();
  redirect("/admin/pages/about");
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
    lead: { tr: text(form, "leadTr"), en: text(form, "leadEn") },
    note: { tr: text(form, "noteTr"), en: text(form, "noteEn") },
    rows,
  };

  await savePageContent("contact", contact);
  purge();
  redirect("/admin/pages/contact");
}
