import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteExhibitionAction,
  saveExhibitionAction,
} from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageField } from "@/components/admin/image-field";
import { getExhibitionById } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function EditExhibition({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const exhibition = isNew ? null : await getExhibitionById(id);
  if (!isNew && !exhibition) notFound();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">
          {isNew ? "Yeni sergi" : exhibition!.title.tr}
        </h1>
        <Link href="/admin/exhibitions" className="adm-btn">
          Sergilere dön
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[60ch]">
        Buradaki sergiler, sergiler sayfasında görseli ve metniyle birlikte öne
        çıkar. Sadece listede görünmesini istediğin katılımlar için “Katılımlar”
        bölümünü kullan.
      </p>

      <form action={saveExhibitionAction} className="mt-8 flex flex-col gap-6">
        {exhibition && (
          <input type="hidden" name="id" value={exhibition.id} />
        )}

        <div className="grid gap-5 md:grid-cols-[120px_minmax(0,1fr)_auto]">
          <label className="block">
            <span className="adm-label">Yıl</span>
            <input
              name="year"
              className="adm-input"
              defaultValue={exhibition?.year ?? ""}
              placeholder="2026"
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Sergi sayfası bağlantısı</span>
            <input
              name="url"
              className="adm-input"
              defaultValue={exhibition?.url ?? ""}
              placeholder="https://… (boşsa bağlantı görünmez)"
            />
          </label>
          <label className="flex items-center gap-2.5 self-end pb-2.5">
            <input
              type="checkbox"
              name="published"
              defaultChecked={exhibition?.published ?? true}
              className="h-4 w-4 accent-[#14140f]"
            />
            <span className="text-[13px]">Sitede yayında</span>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Sergi adı (Türkçe)</span>
            <input
              name="titleTr"
              className="adm-input"
              defaultValue={exhibition?.title.tr ?? ""}
              required
            />
          </label>
          <label className="block">
            <span className="adm-label">Sergi adı (İngilizce)</span>
            <input
              name="titleEn"
              className="adm-input"
              defaultValue={exhibition?.title.en ?? ""}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Mekân (Türkçe)</span>
            <input
              name="venueTr"
              className="adm-input"
              defaultValue={exhibition?.venue.tr ?? ""}
              placeholder="Galeri Nev, İstanbul"
            />
          </label>
          <label className="block">
            <span className="adm-label">Mekân (İngilizce)</span>
            <input
              name="venueEn"
              className="adm-input"
              defaultValue={exhibition?.venue.en ?? ""}
              placeholder="Galeri Nev, Istanbul"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Sergi türü (Türkçe)</span>
            <input
              name="kindTr"
              className="adm-input"
              defaultValue={exhibition?.kind.tr ?? ""}
              placeholder="Kişisel sergi"
            />
          </label>
          <label className="block">
            <span className="adm-label">Sergi türü (İngilizce)</span>
            <input
              name="kindEn"
              className="adm-input"
              defaultValue={exhibition?.kind.en ?? ""}
              placeholder="Solo exhibition"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Sergi metni (Türkçe)</span>
            <textarea
              name="noteTr"
              className="adm-textarea"
              defaultValue={exhibition?.note.tr ?? ""}
            />
          </label>
          <label className="block">
            <span className="adm-label">Sergi metni (İngilizce)</span>
            <textarea
              name="noteEn"
              className="adm-textarea"
              defaultValue={exhibition?.note.en ?? ""}
            />
          </label>
        </div>

        {exhibition ? (
          <div className="adm-card">
            <ImageField
              name="imageKey"
              prefix={`exhibitions/${exhibition.id}`}
              imageKey={exhibition.imageKey}
              label="Sergi görseli"
              hint="Sergiler sayfasında 3:2 oranında kırpılarak gösterilir."
              ratio={1.5}
            />
          </div>
        ) : (
          <p className="adm-note">
            Görseli, sergiyi kaydettikten sonra yükleyebilirsin.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" className="adm-btn adm-btn-primary">
            Kaydet
          </button>
          <Link href="/admin/exhibitions" className="adm-btn">
            Vazgeç
          </Link>
        </div>
      </form>

      {exhibition && (
        <form
          action={deleteExhibitionAction}
          className="mt-12 border-t border-rule pt-6"
        >
          <input type="hidden" name="id" value={exhibition.id} />
          <ConfirmButton
            message={`"${exhibition.title.tr}" silinsin mi? Bu geri alınamaz.`}
          >
            Sergiyi sil
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
