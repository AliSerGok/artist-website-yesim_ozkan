import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteCvAction, saveCvAction } from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAllCvGroups, getCvEntryById } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function EditCv({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const [entry, groups] = await Promise.all([
    isNew ? null : getCvEntryById(id),
    getAllCvGroups(),
  ]);
  if (!isNew && !entry) notFound();

  // "Satır ekle" next to a heading opens the form already filed under it.
  const groupId = entry?.groupId ?? query.group ?? "";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">{isNew ? "Yeni katılım" : entry!.title.tr}</h1>
        <Link href="/admin/cv" className="adm-btn">
          Listeye dön
        </Link>
      </div>

      <form action={saveCvAction} className="mt-8 flex flex-col gap-6">
        {entry && <input type="hidden" name="id" value={entry.id} />}

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_110px_150px_auto]">
          <label className="block">
            <span className="adm-label">Başlık</span>
            <select
              name="groupId"
              className="adm-select"
              defaultValue={groupId}
            >
              <option value="">— başlıksız</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title.tr}
                  {group.published ? "" : " (gizli)"}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="adm-label">Yıl</span>
            <input
              name="year"
              className="adm-input"
              defaultValue={entry?.year ?? ""}
              placeholder="2026"
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Tür</span>
            <select
              name="kind"
              className="adm-select"
              defaultValue={entry?.kind ?? ""}
            >
              <option value="">— etiket yok</option>
              <option value="solo">Kişisel</option>
              <option value="group">Grup</option>
            </select>
          </label>
          <label className="flex items-center gap-2.5 self-end pb-2.5">
            <input
              type="checkbox"
              name="published"
              defaultChecked={entry?.published ?? true}
              className="h-4 w-4 accent-[#14140f]"
            />
            <span className="text-[13px]">Yayında</span>
          </label>
        </div>

        {groups.length === 0 && (
          <p className="adm-note -mt-2 max-w-[62ch]">
            Henüz hiç başlık yok. <Link href="/admin/cv/groups/new" className="underline">Yeni başlık</Link> açarsan
            satırları Sergiler, Yarışmalar gibi bölümlere ayırabilirsin.
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Satır (Türkçe)</span>
            <input
              name="titleTr"
              className="adm-input"
              defaultValue={entry?.title.tr ?? ""}
              placeholder="Uzun Sabah — Galeri Nev, İstanbul"
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Satır (İngilizce)</span>
            <input
              name="titleEn"
              className="adm-input"
              defaultValue={entry?.title.en ?? ""}
              placeholder="The Long Morning — Galeri Nev, Istanbul"
            />
          </label>
        </div>

        <label className="block">
          <span className="adm-label">Bağlantı</span>
          <input
            name="url"
            className="adm-input"
            defaultValue={entry?.url ?? ""}
            placeholder="https://… (boşsa düz metin görünür)"
          />
        </label>

        <div className="flex items-center gap-3">
          <SubmitButton
            className="adm-btn adm-btn-primary"
            busyLabel="Kaydediliyor…"
          >
            Kaydet
          </SubmitButton>
          <Link href="/admin/cv" className="adm-btn">
            Vazgeç
          </Link>
        </div>
      </form>

      {entry && (
        <form
          action={deleteCvAction}
          className="mt-12 border-t border-rule pt-6"
        >
          <input type="hidden" name="id" value={entry.id} />
          <ConfirmButton message={`"${entry.title.tr}" silinsin mi?`}>
            Satırı sil
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
