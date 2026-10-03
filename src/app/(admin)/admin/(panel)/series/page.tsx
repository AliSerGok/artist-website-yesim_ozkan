import Link from "next/link";

import {
  deleteSeriesRowAction,
  reorderSeriesAction,
  saveSeriesTypeAction,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { TypeCard } from "@/components/admin/type-card";
import { getAllSeries, getAllWorks, getSeriesStyles } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { mediaUrl } from "@/lib/media";
import { innerStyleAttrs, styleAttrs } from "@/lib/type-style";

/* What each menu dresses: its own specimen, and the list below it. */
const TITLES = '.adm-row-title, [data-dress="styleTitle"]';
const YEARS = '.adm-row-year, [data-dress="styleYears"]';

export const dynamic = "force-dynamic";

export default async function AdminSeries() {
  const [series, works, styles] = await Promise.all([
    getAllSeries(),
    getAllWorks(),
    getSeriesStyles(),
  ]);
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

      <TypeCard
        action={saveSeriesTypeAction}
        label="Bütün serilerin yazı tipi"
        note="Sitedeki her seri adını, alt satırını ve metnini bu yüzlerle yazar — kartlarda ve serinin kendi sayfasında. Tek tek seçilmez; buradaki seçim hepsini birden değiştirir."
        choices={[
          {
            name: "styleTitle",
            style: styles.title,
            label: "Adların yazı tipi",
            sample: "Kıvrım",
            fields: TITLES,
          },
          {
            name: "styleYears",
            style: styles.years,
            label: "Adın yanındaki yıl aralığı",
            sample: "2023–2025",
            fields: YEARS,
          },
          {
            name: "styleMeta",
            style: styles.meta,
            label: "Alt satırlar",
            sample: "4 iş, serigrafi",
          },
          {
            name: "styleNote",
            style: styles.note,
            label: "Seri metinleri",
            sample: "Aynı perdenin dört kez baskıya alınmış hali.",
          },
        ]}
      />

      <SortableList
        className="mt-6 border-t border-rule"
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
                    className="adm-row-title font-serif text-[18px] leading-tight hover:text-mute"
                    {...styleAttrs(item.styles.title)}
                  >
                    {item.title.tr}
                    <span
                      className="adm-row-year text-mute-2"
                      {...innerStyleAttrs(item.styles.years)}
                    >
                      , {item.years}
                    </span>
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
