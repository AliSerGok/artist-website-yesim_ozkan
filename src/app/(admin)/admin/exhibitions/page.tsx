import Link from "next/link";

import { moveExhibitionAction } from "@/app/(admin)/admin/actions";
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
        görünür. Yalnızca listede yer alacak katılımlar “Katılımlar”
        bölümünde.
      </p>

      <div className="mt-8 border-t border-rule">
        {exhibitions.map((exhibition, index) => (
          <div
            key={exhibition.id}
            className="grid items-center gap-4 border-b border-rule py-3 [grid-template-columns:56px_minmax(0,1fr)_auto]"
          >
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
              <form action={moveExhibitionAction}>
                <input type="hidden" name="id" value={exhibition.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  className="adm-btn px-2.5"
                  disabled={index === 0}
                  aria-label="Yukarı taşı"
                >
                  ↑
                </button>
              </form>
              <form action={moveExhibitionAction}>
                <input type="hidden" name="id" value={exhibition.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  className="adm-btn px-2.5"
                  disabled={index === exhibitions.length - 1}
                  aria-label="Aşağı taşı"
                >
                  ↓
                </button>
              </form>
              <Link
                href={`/admin/exhibitions/${exhibition.id}`}
                className="adm-btn"
              >
                Düzenle
              </Link>
            </div>
          </div>
        ))}
      </div>

      {exhibitions.length === 0 && (
        <p className="adm-note mt-6">Henüz sergi eklenmemiş.</p>
      )}
    </>
  );
}
