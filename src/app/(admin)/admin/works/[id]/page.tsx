import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteWorkAction, saveWorkAction } from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { getAllSeries, getWorkById } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { MEDIUMS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditWork({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const work = isNew ? null : await getWorkById(id);
  if (!isNew && !work) notFound();

  const series = await getAllSeries();
  const label = dict("tr").medium;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">{isNew ? "Yeni iş" : work!.title.tr}</h1>
        <Link href="/admin/works" className="adm-btn">
          İşlere dön
        </Link>
      </div>

      <form action={saveWorkAction} className="mt-8 flex flex-col gap-6">
        {work && <input type="hidden" name="id" value={work.id} />}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Başlık (Türkçe)</span>
            <input
              name="titleTr"
              className="adm-input"
              defaultValue={work?.title.tr ?? ""}
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Başlık (İngilizce)</span>
            <input
              name="titleEn"
              className="adm-input"
              defaultValue={work?.title.en ?? ""}
              placeholder="Boş bırakılırsa Türkçesi kullanılır"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Teknik ve ölçü (Türkçe)</span>
            <input
              name="captionTr"
              className="adm-input"
              defaultValue={work?.caption.tr ?? ""}
              placeholder="Ketende yağlıboya, 120 × 90 cm"
            />
          </label>
          <label className="block">
            <span className="adm-label">Teknik ve ölçü (İngilizce)</span>
            <input
              name="captionEn"
              className="adm-input"
              defaultValue={work?.caption.en ?? ""}
              placeholder="Oil on linen, 120 × 90 cm"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Eser hakkında (Türkçe)</span>
            <textarea
              name="noteTr"
              className="adm-textarea"
              defaultValue={work?.note.tr ?? ""}
              placeholder="Büyütülmüş görünümde eserin altında çıkan metin."
            />
          </label>
          <label className="block">
            <span className="adm-label">Eser hakkında (İngilizce)</span>
            <textarea
              name="noteEn"
              className="adm-textarea"
              defaultValue={work?.note.en ?? ""}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <label className="block">
            <span className="adm-label">Yıl</span>
            <input
              name="year"
              className="adm-input"
              defaultValue={work?.year ?? ""}
              placeholder="2026"
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Teknik</span>
            <select
              name="medium"
              className="adm-select capitalize"
              defaultValue={work?.medium ?? "paintings"}
            >
              {MEDIUMS.map((medium) => (
                <option key={medium} value={medium} className="capitalize">
                  {label[medium]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="adm-label">Seri</span>
            <select
              name="seriesId"
              className="adm-select"
              defaultValue={work?.seriesId ?? ""}
            >
              <option value="">Seri yok (tek iş)</option>
              {series.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title.tr}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 self-end pb-2.5">
            <input
              type="checkbox"
              name="published"
              defaultChecked={work?.published ?? true}
              className="h-4 w-4 accent-[#14140f]"
            />
            <span className="text-[13px]">Sitede yayında</span>
          </label>
        </div>

        {work ? (
          <div className="adm-card">
            <ImageUploader workId={work.id} imageKey={work.imageKey} />
          </div>
        ) : (
          <p className="adm-note">
            Görseli, işi kaydettikten sonra yükleyebilirsin.
          </p>
        )}

        <details className="adm-card">
          <summary className="cursor-pointer text-[13px]">
            Görsel yokken kullanılacak ayarlar
          </summary>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className="adm-label">Yer tutucu etiketi</span>
              <input
                name="slot"
                className="adm-input"
                defaultValue={work?.slot ?? ""}
                placeholder="painting 120×90"
              />
            </label>
            <label className="block">
              <span className="adm-label">Oran — en</span>
              <input
                name="width"
                type="number"
                min={1}
                className="adm-input"
                defaultValue={work?.width ?? 3}
              />
            </label>
            <label className="block">
              <span className="adm-label">Oran — boy</span>
              <input
                name="height"
                type="number"
                min={1}
                className="adm-input"
                defaultValue={work?.height ?? 4}
              />
            </label>
          </div>
          <p className="adm-note mt-3">
            Görsel yüklendiğinde en ve boy otomatik güncellenir.
          </p>
        </details>

        <div className="flex items-center gap-3">
          <button type="submit" className="adm-btn adm-btn-primary">
            Kaydet
          </button>
          <Link href="/admin/works" className="adm-btn">
            Vazgeç
          </Link>
        </div>
      </form>

      {work && (
        <form
          action={deleteWorkAction}
          className="mt-12 border-t border-rule pt-6"
        >
          <input type="hidden" name="id" value={work.id} />
          <ConfirmButton
            message={`"${work.title.tr}" silinsin mi? Bu geri alınamaz.`}
          >
            İşi sil
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
