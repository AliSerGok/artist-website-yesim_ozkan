import Link from "next/link";

import {
  deleteExhibitionRowAction,
  reorderExhibitionsAction,
  saveExhibitionsTypeAction,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { TypeCard } from "@/components/admin/type-card";
import {
  getAllExhibitions,
  getExhibitionLayout,
  getExhibitionStyles,
} from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import type { ExhibitionLayout } from "@/lib/types";
import { styleAttrs } from "@/lib/type-style";

/* What each menu dresses: its own specimen, and the list below it. */
const TITLES = '.adm-row-title, [data-dress="styleTitle"]';
const VENUES = '.adm-row-venue, [data-dress="styleVenue"]';
const KINDS = '.adm-row-kind, [data-dress="styleKind"]';

/** The three ways the page can lay its pictures out; see lib/types. */
const LAYOUT_LABEL: [ExhibitionLayout, string][] = [
  ["alternate", "Bir sola bir sağa"],
  ["left", "Hepsi solda"],
  ["right", "Hepsi sağda"],
];

export const dynamic = "force-dynamic";

export default async function AdminExhibitions() {
  const [exhibitions, styles, layout] = await Promise.all([
    getAllExhibitions(),
    getExhibitionStyles(),
    getExhibitionLayout(),
  ]);

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

      <TypeCard
        action={saveExhibitionsTypeAction}
        label="Bütün sergilerin yazı tipi"
        note="Sergiler sayfasındaki her sergi adını, mekânını, türünü ve metnini bu yüzlerle yazar. Tek tek seçilmez; buradaki seçim hepsini birden değiştirir."
        choices={[
          {
            name: "styleTitle",
            style: styles.title,
            label: "Adların yazı tipi",
            sample: "Uzun Sabah",
            fields: TITLES,
          },
          {
            name: "styleVenue",
            style: styles.venue,
            label: "Mekânlar",
            sample: "Galeri Nev, İstanbul",
            fields: VENUES,
          },
          {
            name: "styleKind",
            style: styles.kind,
            label: "Yılın yanındaki küçük satır",
            sample: "kişisel",
            fields: KINDS,
          },
          {
            name: "styleNote",
            style: styles.note,
            label: "Sergi metinleri",
            sample: "Sergiye adını veren resim duvarı boydan boya alıyor.",
          },
        ]}
        extra={
          <label className="block w-[min(100%,260px)]">
            <span className="adm-label">Görsellerin yerleşimi</span>
            <select name="layout" className="adm-select" defaultValue={layout}>
              {LAYOUT_LABEL.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
            <span className="adm-note mt-2 block max-w-[62ch]">
              Sergiler sayfasında görsellerin hangi yana yaslanacağı. Dar
              ekranda görsel her zaman yazının üstünde durur.
            </span>
          </label>
        }
      />

      <SortableList
        className="mt-6 border-t border-rule"
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
                  className="adm-row-title font-serif text-[18px] leading-tight hover:text-mute"
                  {...styleAttrs(exhibition.styles.title)}
                >
                  {exhibition.title.tr}
                </Link>
                <div className="adm-note mt-1">
                  <span
                    className="adm-row-title"
                    {...styleAttrs(exhibition.styles.title)}
                  >
                    {exhibition.year}
                  </span>{" "}
                  ·{" "}
                  <span
                    className="adm-row-venue"
                    {...styleAttrs(exhibition.styles.venue)}
                  >
                    {exhibition.venue.tr}
                  </span>
                  {exhibition.kind.tr ? (
                    <>
                      {" · "}
                      <span
                        className="adm-row-kind"
                        {...styleAttrs(exhibition.styles.kind)}
                      >
                        {exhibition.kind.tr}
                      </span>
                    </>
                  ) : (
                    ""
                  )}
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
