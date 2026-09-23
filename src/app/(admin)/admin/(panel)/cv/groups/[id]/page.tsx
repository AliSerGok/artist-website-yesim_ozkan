import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteCvGroupAction,
  saveCvGroupAction,
} from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SaveButton } from "@/components/admin/save-button";
import { getAllCvEntries, getCvGroupById } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function EditCvGroup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const group = isNew ? null : await getCvGroupById(id);
  if (!isNew && !group) notFound();

  // Deleting a heading keeps its lines, so say how many are about to come loose.
  const rowCount = group
    ? (await getAllCvEntries()).filter((entry) => entry.groupId === group.id)
        .length
    : 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">{isNew ? "Yeni başlık" : group!.title.tr}</h1>
        <Link href="/admin/cv" className="adm-btn">
          Listeye dön
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[62ch]">
        Katılım listesindeki bir ara başlık. Sırasını listede, başlığın
        yanındaki tutamaçtan sürükleyerek değiştirirsin.
      </p>

      <form action={saveCvGroupAction} className="mt-8 flex flex-col gap-6">
        {group && <input type="hidden" name="id" value={group.id} />}

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="block">
            <span className="adm-label">Başlık (Türkçe)</span>
            <input
              name="titleTr"
              className="adm-input"
              defaultValue={group?.title.tr ?? ""}
              placeholder="Yarışmalar ve ödüller"
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Başlık (İngilizce)</span>
            <input
              name="titleEn"
              className="adm-input"
              defaultValue={group?.title.en ?? ""}
              placeholder="Competitions and awards"
            />
          </label>
          <label className="flex items-center gap-2.5 self-end pb-2.5">
            <input
              type="checkbox"
              name="published"
              defaultChecked={group?.published ?? true}
              className="h-4 w-4 accent-[#14140f]"
            />
            <span className="text-[13px]">Yayında</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <SaveButton />
          <Link href="/admin/cv" className="adm-btn">
            Vazgeç
          </Link>
        </div>
      </form>

      {group && (
        <form
          action={deleteCvGroupAction}
          className="mt-12 border-t border-rule pt-6"
        >
          <input type="hidden" name="id" value={group.id} />
          <ConfirmButton
            message={
              rowCount > 0
                ? `"${group.title.tr}" başlığı silinsin mi? ${rowCount} satır silinmez, başlıksız olarak listenin üstüne taşınır.`
                : `"${group.title.tr}" silinsin mi?`
            }
          >
            Başlığı sil
          </ConfirmButton>
          {rowCount > 0 && (
            <p className="adm-note mt-3 max-w-[62ch]">
              Bu başlığın {rowCount} satırı silinmez; başlıksız olarak listenin
              en üstünde kalır, oradan başka bir başlığa taşıyabilirsin.
            </p>
          )}
        </form>
      )}
    </>
  );
}
