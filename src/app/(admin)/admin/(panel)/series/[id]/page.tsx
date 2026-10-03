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
import { LiveEdit } from "@/components/admin/live-edit";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { SaveButton } from "@/components/admin/save-button";
import { dress } from "@/components/admin/type-menu";
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
        Serinin kendi yazıları ve ayarları. Üstteki kutu serinin sayfasının
        başını sitede göründüğü gibi gösterir; yazdıkça değişir. Yazı tipi
        burada seçilmez — bütün seriler aynı yüzle yazılır, onu{" "}
        <Link href="/admin/series" className="underline">
          Seriler
        </Link>{" "}
        sayfasının başındaki karttan değiştirirsin.
      </p>

      <form action={saveSeriesAction} className="mt-8 flex flex-col gap-5">
        {series && <input type="hidden" name="id" value={series.id} />}

        <LiveEdit>
          <div className="adm-card flex flex-col gap-3.5" data-card>
            <div className="adm-card-head">
              <span className="label">Seri yazıları</span>
              <span className="adm-lang">TR</span>
            </div>

            {/* The head of the series' page, as the site sets it. */}
            <div className="adm-preview" data-preview>
              <div
                className="adm-live-title font-serif text-[20px] leading-[1.25]"
                {...styleAttrs(styles.title)}
              >
                {series?.title.tr || (
                  <span className="text-mute-3">Seri adı yazılmadı.</span>
                )}
              </div>
              <div
                className="mt-1.5 text-[13px] leading-[1.6] text-mute-2"
                {...styleAttrs(styles.meta)}
              >
                {series?.years && (
                  <>
                    <span {...innerStyleAttrs(styles.years)}>
                      {series.years}
                    </span>
                    {series.meta.tr ? " — " : ""}
                  </>
                )}
                <span className="adm-live-meta">{series?.meta.tr ?? ""}</span>
              </div>
              <div
                className="adm-live-note adm-prose mt-3 text-[14px] leading-[1.7] text-ink-soft"
                {...styleAttrs(styles.note)}
              >
                {(series?.note.tr ?? "")
                  .split(/\n\s*\n/)
                  .filter((part) => part.trim())
                  .map((part, index) => (
                    <p key={index}>{part}</p>
                  ))}
              </div>
            </div>

            {/* Every field at once: a series is three short things to say, and
                folding each one away behind its own button only hid them. */}
            <div className="flex flex-col gap-5 border-t border-rule pt-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Seri adı (Türkçe)</span>
                  <input
                    name="titleTr"
                    className="adm-input"
                    defaultValue={series?.title.tr ?? ""}
                    required
                    data-live="line"
                    data-live-target=".adm-live-title"
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
                    data-live-target=".adm-live-title"
                    data-live-lang="en"
                    {...dress("styleTitle", styles.title)}
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
                    data-live="line"
                    data-live-target=".adm-live-meta"
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
                    data-live-target=".adm-live-meta"
                    data-live-lang="en"
                    {...dress("styleMeta", styles.meta)}
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
                    data-live="text"
                    data-live-target=".adm-live-note"
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
                    data-live-target=".adm-live-note"
                    data-live-lang="en"
                    {...dress("styleNote", styles.note)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <span className="label">Ayarlar</span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
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
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-rule pt-4">
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="showTitles"
                  defaultChecked={series?.showTitles ?? true}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#14140f]"
                />
                <span className="text-[13px]">
                  Eser adlarını göster
                  <span className="adm-note mt-0.5 block max-w-[62ch]">
                    Kapalıyken serinin sayfası yalnızca görsellerden oluşur.
                    Bilgi kaybolmaz — bir esere tıklayınca adı, yılı ve metni
                    yine görünür.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={series?.published ?? true}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#14140f]"
                />
                <span className="text-[13px]">
                  Sitede yayında
                  <span className="adm-note mt-0.5 block max-w-[62ch]">
                    Kapalıyken seri taslaktır; sitede görünmez.
                  </span>
                </span>
              </label>
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
