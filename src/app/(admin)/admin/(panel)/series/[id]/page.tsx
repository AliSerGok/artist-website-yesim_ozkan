import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addSeriesWorksAction,
  deleteSeriesAction,
  reorderWorksAction,
  saveSeriesAction,
} from "@/app/(admin)/admin/actions";
import { BulkUpload } from "@/components/admin/bulk-upload";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  FieldCard,
  FieldPreview,
  LIVE_TEXT,
} from "@/components/admin/field-card";
import { LiveEdit } from "@/components/admin/live-edit";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { SaveButton } from "@/components/admin/save-button";
import { dress, TypeMenu } from "@/components/admin/type-menu";
import { getAllWorks, getSeriesById } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { mediaUrl } from "@/lib/media";
import { innerStyleAttrs, styleAttrs } from "@/lib/type-style";
import { MEDIUMS, SERIES_STYLES } from "@/lib/types";

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
  const styles = series?.styles ?? SERIES_STYLES;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1" {...styleAttrs(styles.title)}>
          {isNew ? "Yeni seri" : series!.title.tr}
        </h1>
        <Link href="/admin/series" className="adm-btn">
          Serilere dön
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[64ch]">
        Her kart sitede göründüğü gibi duruyor; yazmak için “Düzenle”ye bas.
        Aynı anda tek kart açık kalır. Her yazının kendi yazı tipi, kalını ve
        italiği var — seçtiğin anda kartın üstünde görürsün.
      </p>

      <form action={saveSeriesAction} className="mt-8 flex flex-col gap-5">
        {series && <input type="hidden" name="id" value={series.id} />}

        <LiveEdit>
          <FieldCard
            label="Seri adı"
            hint="Türkçesi, İngilizcesi ve yazı tipi"
            open={isNew}
            preview={
              <FieldPreview
                kind="title"
                value={series?.title.tr ?? ""}
                style={styles.title}
                empty="Seri adı yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Seri adı (Türkçe)</span>
                  <input
                    name="titleTr"
                    className="adm-input"
                    defaultValue={series?.title.tr ?? ""}
                    required
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                    {...dress("styleTitle", styles.title)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Seri adı (İngilizce)</span>
                  <input
                    name="titleEn"
                    className="adm-input"
                    defaultValue={series?.title.en ?? ""}
                    placeholder="Boş bırakılırsa Türkçesi kullanılır"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                    {...dress("styleTitle", styles.title)}
                  />
                </label>
              </div>
              <TypeMenu
                name="styleTitle"
                style={styles.title}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <FieldCard
            label="Alt satır"
            hint="Seri adının altındaki kısa satır ve yazı tipi"
            preview={
              <FieldPreview
                value={series?.meta.tr ?? ""}
                style={styles.meta}
                empty="Alt satır yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Alt satır (Türkçe)</span>
                  <input
                    name="metaTr"
                    className="adm-input"
                    defaultValue={series?.meta.tr ?? ""}
                    placeholder="4 iş, serigrafi"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                    {...dress("styleMeta", styles.meta)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Alt satır (İngilizce)</span>
                  <input
                    name="metaEn"
                    className="adm-input"
                    defaultValue={series?.meta.en ?? ""}
                    placeholder="4 works, screenprint"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                    {...dress("styleMeta", styles.meta)}
                  />
                </label>
              </div>
              <TypeMenu
                name="styleMeta"
                style={styles.meta}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <FieldCard
            label="Seri metni"
            hint="Serinin sayfasındaki metin ve yazı tipi"
            preview={
              <FieldPreview
                kind="prose"
                value={series?.note.tr ?? ""}
                style={styles.note}
                empty="Metin yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Seri metni (Türkçe)</span>
                  <textarea
                    name="noteTr"
                    className="adm-textarea"
                    defaultValue={series?.note.tr ?? ""}
                    data-live="text"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                    {...dress("styleNote", styles.note)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Seri metni (İngilizce)</span>
                  <textarea
                    name="noteEn"
                    className="adm-textarea"
                    defaultValue={series?.note.en ?? ""}
                    data-live="text"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                    {...dress("styleNote", styles.note)}
                  />
                </label>
              </div>
              <TypeMenu
                name="styleNote"
                style={styles.note}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <div className="adm-card">
            <div className="adm-card-head">
              <span className="label">
                Yıl aralığı, teknik, kapak işi ve yayın
              </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-4">
              <label className="block">
                <span className="adm-label">Yıl aralığı</span>
                <input
                  name="years"
                  className="adm-input"
                  defaultValue={series?.years ?? ""}
                  placeholder="2023–2025"
                  {...dress("styleYears", styles.years)}
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

            {/*
              The span of years is written after the series name on its card
              and before the alt satır on its own page, so it is set on its
              own: slanted or upright, bold or not, in a face of its choosing.
            */}
            <div className="mt-5">
              <TypeMenu
                name="styleYears"
                style={styles.years}
                label="Yıl aralığının yazı tipi"
              />
              <p className="adm-note mt-3 max-w-[62ch]">
                Yıl aralığı, seri kartında adından sonra virgülle, serinin kendi
                sayfasında ise alt satırın başında yazılır. Buradaki seçim
                yalnızca yıl aralığını etkiler.
              </p>
            </div>
          </div>
        </LiveEdit>

        <div className="flex items-center gap-3">
          <SaveButton />
          <Link href="/admin/series" className="adm-btn">
            Vazgeç
          </Link>
        </div>
      </form>

      {series ? (
        <div className="adm-card mt-10">
          <span className="adm-label">Bu serideki işler</span>
          {members.length === 0 ? (
            <p className="adm-note max-w-[62ch]">
              Henüz iş yok. Aşağıdan görselleri topluca yükle — her biri bu
              serinin bir işi olur. Var olan bir işi bağlamak istersen, işin
              kendi sayfasındaki “Seri” alanından da seçebilirsin.
            </p>
          ) : (
            <>
              <p className="adm-note mb-3 max-w-[62ch]">
                Serinin sayfasında bu sırayla görünürler; tutamaçtan
                sürükleyerek değiştir. Taşıdığın iş yalnızca bu serinin işleri
                arasında yer değiştirir, İşler listesindeki sıra da buna uyar.
                Kapak işi “İlk iş” bırakıldıysa en üste taşıdığın iş kapak olur.
              </p>

              <SortableList
                action={reorderWorksAction}
                rows={members.map((work) => ({
                  id: work.id,
                  content: (
                    <div className="grid items-center gap-3 border-t border-rule py-2 [grid-template-columns:auto_40px_minmax(0,1fr)_auto]">
                      <DragHandle id={work.id} />

                      {work.imageKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(work.imageKey, "grid")}
                          alt=""
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <div className="slot h-10 w-10" />
                      )}

                      <Link
                        href={`/admin/works/${work.id}`}
                        className="min-w-0 text-[13px] hover:text-mute"
                        {...styleAttrs(work.styles.title)}
                      >
                        {work.title.tr}
                        <span
                          className="text-mute-2"
                          {...innerStyleAttrs(work.styles.year)}
                        >
                          , {work.year}
                        </span>
                        {work.published ? "" : " · taslak"}
                      </Link>

                      <Link
                        href={`/admin/works/${work.id}`}
                        className="adm-btn"
                        title="Başlığı, bilgileri ve kırpmayı düzenle"
                      >
                        Düzenle
                      </Link>
                    </div>
                  ),
                }))}
              />
            </>
          )}

          <div className="mt-6 border-t border-rule pt-5">
            <span className="adm-label">Görselleri topluca yükle</span>
            <BulkUpload seriesId={series.id} action={addSeriesWorksAction} />
          </div>
        </div>
      ) : (
        <p className="adm-note mt-8 max-w-[62ch]">
          Seriyi kaydettikten sonra görselleri topluca yükleyebilirsin: her biri
          bu serinin bir işi olur, sonra tek tek düzenlenir, kırpılır ve
          sürüklenerek sıralanır.
        </p>
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
