import Link from "next/link";

import { moveExhibitionAction } from "@/app/(admin)/admin/actions";
import { getExhibitions } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminExhibitions() {
  const exhibitions = await getExhibitions();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">Sergiler</h1>
        <Link href="/admin/exhibitions/new" className="adm-btn adm-btn-primary">
          Yeni sergi
        </Link>
      </div>

      <div className="mt-8 border-t border-rule">
        {exhibitions.map((exhibition, index) => (
          <div
            key={exhibition.id}
            className="grid items-center gap-4 border-b border-rule py-3 [grid-template-columns:56px_minmax(0,1fr)_auto]"
          >
            <div className="text-[12px] tracking-[0.1em] text-mute-2">
              {exhibition.year}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/exhibitions/${exhibition.id}`}
                className="font-serif text-[18px] leading-tight hover:text-mute"
              >
                {exhibition.title.tr}
              </Link>
              <div className="adm-note mt-1">
                {exhibition.venue.tr}
                {exhibition.kind.tr ? ` · ${exhibition.kind.tr}` : ""}
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
