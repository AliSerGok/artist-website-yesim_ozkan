import Link from "next/link";

import {
  deleteExhibitionRowAction,
  reorderExhibitionsAction,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { getAllExhibitions } from "@/lib/content";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function AdminExhibitions() {
  const exhibitions = await getAllExhibitions();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">Sergiler</h1>
        <Link href="/admin/exhibitions/new" className="adm-btn adm-btn-primary">
          Yeni sergi
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[62ch]">
        Öne çıkan sergiler; her biri görseli ve metniyle sergiler sayfasında
        görünür. Sırayı soldaki tutamaçtan sürükleyerek değiştirirsin. Yalnızca
        listede yer alacak katılımlar “Katılımlar” bölümünde.
      </p>

      <SortableList
        className="mt-8 border-t border-rule"
        action={reorderExhibitionsAction}
        rows={exhibitions.map((exhibition) => ({
          id: exhibition.id,
          content: (
            <div className="grid items-center gap-4 border-b border-rule py-3 [grid-template-columns:auto_56px_minmax(0,1fr)_auto]">
              <DragHandle id={exhibition.id} />

              {exhibition.imageKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(exhibition.imageKey, "grid")}
                  alt=""
                  className="h-14 w-14 object-cover"
                />
              ) : (
                <div className="slot h-14 w-14" />
              )}

              <div className="min-w-0">
                <Link
                  href={`/admin/exhibitions/${exhibition.id}`}
                  className="font-serif text-[18px] leading-tight hover:text-mute"
                >
                  {exhibition.title.tr}
                </Link>
                <div className="adm-note mt-1">
                  {exhibition.year} · {exhibition.venue.tr}
                  {exhibition.kind.tr ? ` · ${exhibition.kind.tr}` : ""}
                  {exhibition.published ? "" : " · taslak"}
                  {exhibition.imageKey ? "" : " · görsel yok"}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/exhibitions/${exhibition.id}`}
                  className="adm-btn"
                >
                  Düzenle
                </Link>
                <ActionForm action={deleteExhibitionRowAction}>
                  <input type="hidden" name="id" value={exhibition.id} />
                  <ConfirmButton
                    message={`"${exhibition.title.tr}" silinsin mi? Bu geri alınamaz.`}
                  >
                    Sil
                  </ConfirmButton>
                </ActionForm>
              </div>
            </div>
          ),
        }))}
      />

      {exhibitions.length === 0 && (
        <p className="adm-note mt-6">Henüz sergi eklenmemiş.</p>
      )}
    </>
  );
}
