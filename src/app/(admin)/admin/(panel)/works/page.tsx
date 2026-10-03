import Link from "next/link";

import {
  deleteWorkRowAction,
  reorderWorksAction,
  saveWorksTypeAction,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { TypeCard } from "@/components/admin/type-card";
import { getAllSeries, getAllWorks, getWorkStyles } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { mediaUrl } from "@/lib/media";
import { innerStyleAttrs, styleAttrs } from "@/lib/type-style";

/* What each menu dresses: its own specimen, and the list below where that
   list already shows the thing being dressed. */
const TITLES = '.adm-row-title, [data-dress="styleTitle"]';
const YEARS = '.adm-row-year, [data-dress="styleYear"]';

export const dynamic = "force-dynamic";

export default async function AdminWorks() {
  const [works, series, styles] = await Promise.all([
    getAllWorks(),
    getAllSeries(),
    getWorkStyles(),
  ]);
  const seriesTitle = new Map(series.map((item) => [item.id, item.title.tr]));
  const label = dict("tr").medium;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">İşler</h1>
        <Link href="/admin/works/new" className="adm-btn adm-btn-primary">
          Yeni iş
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[62ch]">
        Sıralama sitedeki sıralamadır; bir satırı soldaki tutamacından
        sürükleyip bırakarak istediğin yere taşı. Bir seriye bağlı işler ana
        sayfada tek tek görünmez, serinin sayfasında listelenir.
      </p>

      <TypeCard
        action={saveWorksTypeAction}
        label="Bütün işlerin yazı tipi"
        note="Sitedeki her iş adını, künyesini ve metnini bu yüzlerle yazar — kartlarda, büyütülmüş görünümde ve işin kendi sayfasında. Tek tek seçilmez; buradaki seçim hepsini birden değiştirir."
        choices={[
          {
            name: "styleTitle",
            style: styles.title,
            label: "Adların yazı tipi",
            sample: "Uzun Sabah",
            fields: TITLES,
          },
          {
            name: "styleYear",
            style: styles.year,
            label: "Adın yanındaki yıl",
            sample: "2026",
            fields: YEARS,
          },
          {
            name: "styleCaption",
            style: styles.caption,
            label: "Künye satırları",
            sample: "Ketende yağlıboya, 120 × 90 cm",
          },
          {
            name: "styleNote",
            style: styles.note,
            label: "Eser metinleri",
            sample: "Kadıköy'deki atölyenin kuzey duvarı.",
          },
        ]}
      />

      <SortableList
        className="mt-6 border-t border-rule"
        action={reorderWorksAction}
        rows={works.map((work) => ({
          id: work.id,
          content: (
            <div className="grid items-center gap-4 border-b border-rule py-3 [grid-template-columns:auto_56px_minmax(0,1fr)_auto]">
              <DragHandle id={work.id} />

              {work.imageKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(work.imageKey, "grid")}
                  alt=""
                  className="h-14 w-14 object-cover"
                />
              ) : (
                <div className="slot h-14 w-14" />
              )}

              <div className="min-w-0">
                <Link
                  href={`/admin/works/${work.id}`}
                  className="adm-row-title font-serif text-[18px] leading-tight hover:text-mute"
                  {...styleAttrs(work.styles.title)}
                >
                  {work.title.tr}
                  <span
                    className="adm-row-year text-mute-2"
                    {...innerStyleAttrs(work.styles.year)}
                  >
                    , {work.year}
                  </span>
                </Link>
                <div className="adm-note mt-1 capitalize">
                  {label[work.medium]}
                  {work.seriesId
                    ? ` · ${seriesTitle.get(work.seriesId) ?? "seri"}`
                    : ""}
                  {work.published ? "" : " · taslak"}
                  {work.imageKey ? "" : " · görsel yok"}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link href={`/admin/works/${work.id}`} className="adm-btn">
                  Düzenle
                </Link>
                <ActionForm action={deleteWorkRowAction}>
                  <input type="hidden" name="id" value={work.id} />
                  <ConfirmButton
                    message={`"${work.title.tr}" silinsin mi? Bu geri alınamaz.`}
                  >
                    Sil
                  </ConfirmButton>
                </ActionForm>
              </div>
            </div>
          ),
        }))}
      />

      {works.length === 0 && (
        <p className="adm-note mt-6">Henüz iş eklenmemiş.</p>
      )}
    </>
  );
}
