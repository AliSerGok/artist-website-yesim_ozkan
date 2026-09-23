import Link from "next/link";

import { moveWorkAction } from "@/app/(admin)/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAllSeries, getAllWorks } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function AdminWorks() {
  const [works, series] = await Promise.all([getAllWorks(), getAllSeries()]);
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

      <p className="adm-note mt-3">
        Sıralama sitedeki sıralamadır. Bir seriye bağlı işler ana sayfada tek
        tek görünmez, serinin sayfasında listelenir.
      </p>

      <div className="mt-8 border-t border-rule">
        {works.map((work, index) => (
          <div
            key={work.id}
            className="grid items-center gap-4 border-b border-rule py-3 [grid-template-columns:56px_minmax(0,1fr)_auto]"
          >
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
                className="font-serif text-[18px] leading-tight hover:text-mute"
              >
                {work.title.tr}
                <span className="text-mute-2 italic">, {work.year}</span>
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
              <form action={moveWorkAction}>
                <input type="hidden" name="id" value={work.id} />
                <input type="hidden" name="direction" value="up" />
                <SubmitButton
                  className="adm-btn px-2.5"
                  disabled={index === 0}
                  aria-label="Yukarı taşı"
                >
                  ↑
                </SubmitButton>
              </form>
              <form action={moveWorkAction}>
                <input type="hidden" name="id" value={work.id} />
                <input type="hidden" name="direction" value="down" />
                <SubmitButton
                  className="adm-btn px-2.5"
                  disabled={index === works.length - 1}
                  aria-label="Aşağı taşı"
                >
                  ↓
                </SubmitButton>
              </form>
              <Link href={`/admin/works/${work.id}`} className="adm-btn">
                Düzenle
              </Link>
            </div>
          </div>
        ))}
      </div>

      {works.length === 0 && (
        <p className="adm-note mt-6">Henüz iş eklenmemiş.</p>
      )}
    </>
  );
}
