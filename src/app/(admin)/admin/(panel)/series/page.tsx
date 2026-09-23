import Link from "next/link";

import {
  deleteSeriesRowAction,
  reorderSeriesAction,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { getAllSeries, getAllWorks } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function AdminSeries() {
  const [series, works] = await Promise.all([getAllSeries(), getAllWorks()]);
  const label = dict("tr").medium;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">Seriler</h1>
        <Link href="/admin/series/new" className="adm-btn adm-btn-primary">
          Yeni seri
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[60ch]">
        Bir seri, ana sayfada tek bir kart olarak görünür; içindeki işler
        serinin kendi sayfasında listelenir. Sırayı soldaki tutamaçtan
        sürükleyerek değiştirirsin. Bir işi seriye bağlamak için işin düzenleme
        sayfasındaki “Seri” alanını kullan.
      </p>

      <SortableList
        className="mt-8 border-t border-rule"
        action={reorderSeriesAction}
        rows={series.map((item) => {
          const members = works.filter((work) => work.seriesId === item.id);
          const cover =
            members.find((work) => work.id === item.coverWorkId) ?? members[0];

          return {
            id: item.id,
            content: (
              <div className="grid items-center gap-4 border-b border-rule py-3 [grid-template-columns:auto_56px_minmax(0,1fr)_auto]">
                <DragHandle id={item.id} />

                {cover?.imageKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(cover.imageKey, "grid")}
                    alt=""
                    className="h-14 w-14 object-cover"
                  />
                ) : (
                  <div className="slot h-14 w-14" />
                )}

                <div className="min-w-0">
                  <Link
                    href={`/admin/series/${item.id}`}
                    className="font-serif text-[18px] leading-tight hover:text-mute"
                  >
                    {item.title.tr}
                    <span className="text-mute-2 italic">, {item.years}</span>
                  </Link>
                  <div className="adm-note mt-1 capitalize">
                    {label[item.medium]} · {members.length} iş
                    {item.published ? "" : " · taslak"}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link href={`/admin/series/${item.id}`} className="adm-btn">
                    Düzenle
                  </Link>
                  <ActionForm action={deleteSeriesRowAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmButton
                      message={
                        members.length > 0
                          ? `"${item.title.tr}" silinsin mi? İçindeki ${members.length} iş silinmez, seriden çıkıp tek başına kalır.`
                          : `"${item.title.tr}" silinsin mi? Bu geri alınamaz.`
                      }
                    >
                      Sil
                    </ConfirmButton>
                  </ActionForm>
                </div>
              </div>
            ),
          };
        })}
      />

      {series.length === 0 && <p className="adm-note mt-6">Henüz seri yok.</p>}
    </>
  );
}
