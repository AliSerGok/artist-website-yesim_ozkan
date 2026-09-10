import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteSeriesAction,
  saveSeriesAction,
} from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { getAllWorks, getSeriesById } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { MEDIUMS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditSeries({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const series = isNew ? null : await getSeriesById(id);
  if (!isNew && !series) notFound();

  const works = await getAllWorks();
  const members = series
    ? works.filter((work) => work.seriesId === series.id)
    : [];
  const label = dict("tr").medium;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">{isNew ? "Yeni seri" : series!.title.tr}</h1>
        <Link href="/admin/series" className="adm-btn">
          Serilere dön
        </Link>
      </div>

      <form action={saveSeriesAction} className="mt-8 flex flex-col gap-6">
        {series && <input type="hidden" name="id" value={series.id} />}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Seri adı (Türkçe)</span>
            <input
              name="titleTr"
              className="adm-input"
              defaultValue={series?.title.tr ?? ""}
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Seri adı (İngilizce)</span>
            <input
              name="titleEn"
              className="adm-input"
              defaultValue={series?.title.en ?? ""}
              placeholder="Boş bırakılırsa Türkçesi kullanılır"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Alt satır (Türkçe)</span>
            <input
              name="metaTr"
              className="adm-input"
              defaultValue={series?.meta.tr ?? ""}
              placeholder="4 iş, serigrafi"
            />
          </label>
          <label className="block">
            <span className="adm-label">Alt satır (İngilizce)</span>
            <input
              name="metaEn"
              className="adm-input"
              defaultValue={series?.meta.en ?? ""}
              placeholder="4 works, screenprint"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Seri metni (Türkçe)</span>
            <textarea
              name="noteTr"
              className="adm-textarea"
              defaultValue={series?.note.tr ?? ""}
            />
          </label>
          <label className="block">
            <span className="adm-label">Seri metni (İngilizce)</span>
            <textarea
              name="noteEn"
              className="adm-textarea"
              defaultValue={series?.note.en ?? ""}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <label className="block">
            <span className="adm-label">Yıl aralığı</span>
            <input
              name="years"
              className="adm-input"
              defaultValue={series?.years ?? ""}
              placeholder="2023–2025"
            />
          </label>
          <label className="block">
            <span className="adm-label">Teknik</span>
            <select
              name="medium"
              className="adm-select capitalize"
              defaultValue={series?.medium ?? "paintings"}
            >
              {MEDIUMS.map((medium) => (
                <option key={medium} value={medium} className="capitalize">
                  {label[medium]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="adm-label">Kapak işi</span>
            <select
              name="coverWorkId"
              className="adm-select"
              defaultValue={series?.coverWorkId ?? ""}
              disabled={members.length === 0}
            >
              <option value="">İlk iş</option>
              {members.map((work) => (
                <option key={work.id} value={work.id}>
                  {work.title.tr}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 self-end pb-2.5">
            <input
              type="checkbox"
              name="published"
              defaultChecked={series?.published ?? true}
              className="h-4 w-4 accent-[#14140f]"
            />
            <span className="text-[13px]">Sitede yayında</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="adm-btn adm-btn-primary">
            Kaydet
          </button>
          <Link href="/admin/series" className="adm-btn">
            Vazgeç
          </Link>
        </div>
      </form>

      {series && (
        <div className="adm-card mt-10">
          <span className="adm-label">Bu serideki işler</span>
          {members.length === 0 ? (
            <p className="adm-note">
              Henüz iş bağlanmamış. Bir işi buraya eklemek için işin düzenleme
              sayfasındaki “Seri” alanından bu seriyi seç.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {members.map((work) => (
                <li key={work.id}>
                  <Link
                    href={`/admin/works/${work.id}`}
                    className="text-[13px] hover:text-mute"
                  >
                    {work.title.tr}
                    <span className="text-mute-2 italic">, {work.year}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {series && (
        <form
          action={deleteSeriesAction}
          className="mt-12 border-t border-rule pt-6"
        >
          <input type="hidden" name="id" value={series.id} />
          <ConfirmButton
            message={`"${series.title.tr}" serisi silinsin mi? İşler silinmez, ana sayfaya döner.`}
          >
            Seriyi sil
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
