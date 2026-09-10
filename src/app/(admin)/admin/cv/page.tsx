import Link from "next/link";

import { moveCvAction } from "@/app/(admin)/admin/actions";
import { getAllCvEntries } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminCv() {
  const entries = await getAllCvEntries();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">Katılımlar</h1>
        <Link href="/admin/cv/new" className="adm-btn adm-btn-primary">
          Yeni satır
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[62ch]">
        Hakkında sayfasının altındaki tam liste. Sıralama buradaki sıralamadır;
        genelde en yeniden eskiye doğru.
      </p>

      <div className="mt-8 border-t border-rule">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="grid items-center gap-4 border-b border-rule py-2.5 [grid-template-columns:56px_minmax(0,1fr)_auto]"
          >
            <div className="font-mono text-[11px] tracking-[0.12em] text-mute-3">
              {entry.year}
            </div>

            <div className="min-w-0">
              <Link
                href={`/admin/cv/${entry.id}`}
                className="text-[14px] hover:text-mute"
              >
                {entry.title.tr}
              </Link>
              <div className="adm-note mt-0.5">
                {entry.kind === "solo" ? "kişisel" : "grup"}
                {entry.published ? "" : " · taslak"}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <form action={moveCvAction}>
                <input type="hidden" name="id" value={entry.id} />
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
              <form action={moveCvAction}>
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  className="adm-btn px-2.5"
                  disabled={index === entries.length - 1}
                  aria-label="Aşağı taşı"
                >
                  ↓
                </button>
              </form>
              <Link href={`/admin/cv/${entry.id}`} className="adm-btn">
                Düzenle
              </Link>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <p className="adm-note mt-6">Henüz katılım eklenmemiş.</p>
      )}
    </>
  );
}
