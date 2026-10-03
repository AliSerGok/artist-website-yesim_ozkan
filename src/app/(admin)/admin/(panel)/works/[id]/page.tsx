import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteWorkAction, saveWorkAction } from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageField } from "@/components/admin/image-field";
import { LiveEdit } from "@/components/admin/live-edit";
import { SaveButton } from "@/components/admin/save-button";
import { dress } from "@/components/admin/type-menu";
import { getAllSeries, getWorkById } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { innerStyleAttrs, styleAttrs } from "@/lib/type-style";
import { MEDIUMS, WORK_STYLES } from "@/lib/types";

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
  const styles = work?.styles ?? WORK_STYLES;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1" {...styleAttrs(styles.title)}>
          {isNew ? "Yeni iş" : work!.title.tr}
        </h1>
        <Link href="/admin/works" className="adm-btn">
          İşlere dön
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[64ch]">
        Eserin kendi yazıları, görseli ve ayarları. Üstteki kutu eseri sitede
        göründüğü gibi gösterir; yazdıkça değişir. Yazı tipi burada seçilmez —
        bütün işler aynı yüzle yazılır, onu{" "}
        <Link href="/admin/works" className="underline">
          İşler
        </Link>{" "}
        sayfasının başındaki karttan değiştirirsin.
      </p>

      <form action={saveWorkAction} className="mt-8 flex flex-col gap-5">
        {work && <input type="hidden" name="id" value={work.id} />}

        <LiveEdit>
          <div className="adm-card flex flex-col gap-3.5" data-card>
            <div className="adm-card-head">
              <span className="label">Eser yazıları</span>
              <span className="adm-lang">TR</span>
            </div>

            {/* The work as the site writes it: name, year, künye, metin. */}
            <div className="adm-preview" data-preview>
              <div
                className="font-serif text-[20px] leading-[1.25]"
                {...styleAttrs(styles.title)}
              >
                <span className="adm-live-title">
                  {work?.title.tr || (
                    <span className="text-mute-3">Başlık yazılmadı.</span>
                  )}
                </span>
                {work?.year && (
                  <span
                    className="text-mute-2"
                    {...innerStyleAttrs(styles.year)}
                  >
                    , {work.year}
                  </span>
                )}
              </div>
              <div
                className="adm-live-caption mt-1.5 text-[13px] leading-[1.6] text-ink-soft"
                {...styleAttrs(styles.caption)}
              >
                {work?.caption.tr ?? ""}
              </div>
              <div
                className="adm-live-note adm-prose mt-3 text-[14px] leading-[1.7] text-ink-soft"
                {...styleAttrs(styles.note)}
              >
                {(work?.note.tr ?? "")
                  .split(/\n\s*\n/)
                  .filter((part) => part.trim())
                  .map((part, index) => (
                    <p key={index}>{part}</p>
                  ))}
              </div>
            </div>

            {/* Every field at once: a work is three short things to say, and
                folding each one away behind its own button only hid them. */}
            <div className="flex flex-col gap-5 border-t border-rule pt-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Başlık (Türkçe)</span>
                  <input
                    name="titleTr"
                    className="adm-input"
                    defaultValue={work?.title.tr ?? ""}
                    required
                    data-live="line"
                    data-live-target=".adm-live-title"
                    data-live-lang="tr"
                    {...dress("styleTitle", styles.title)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Başlık (İngilizce)</span>
                  <input
                    name="titleEn"
                    className="adm-input"
                    defaultValue={work?.title.en ?? ""}
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
                  <span className="adm-label">Teknik ve ölçü (Türkçe)</span>
                  <input
                    name="captionTr"
                    className="adm-input"
                    defaultValue={work?.caption.tr ?? ""}
                    placeholder="Ketende yağlıboya, 120 × 90 cm"
                    data-live="line"
                    data-live-target=".adm-live-caption"
                    data-live-lang="tr"
                    {...dress("styleCaption", styles.caption)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Teknik ve ölçü (İngilizce)</span>
                  <input
                    name="captionEn"
                    className="adm-input"
                    defaultValue={work?.caption.en ?? ""}
                    placeholder="Oil on linen, 120 × 90 cm"
                    data-live="line"
                    data-live-target=".adm-live-caption"
                    data-live-lang="en"
                    {...dress("styleCaption", styles.caption)}
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
                    data-live="text"
                    data-live-target=".adm-live-note"
                    data-live-lang="tr"
                    {...dress("styleNote", styles.note)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Eser hakkında (İngilizce)</span>
                  <textarea
                    name="noteEn"
                    className="adm-textarea"
                    defaultValue={work?.note.en ?? ""}
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
            <ImageField
              name="imageKey"
              /*
               * A work that does not exist yet still needs somewhere to put its
               * picture. The upload only ever hands back a key; writing that key
               * onto a record is the save's job either way, so a new work simply
               * files its image under works/new.
               */
              prefix={work ? `works/${work.id}` : "works/new"}
              imageKey={work?.imageKey ?? null}
              widthName="imageWidth"
              heightName="imageHeight"
              ratio={work ? work.width / work.height : 3 / 4}
            />
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <span className="label">Ayarlar</span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="adm-label">Yıl</span>
                <input
                  name="year"
                  className="adm-input"
                  defaultValue={work?.year ?? ""}
                  placeholder="2026"
                  required
                  {...dress("styleYear", styles.year)}
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
            </div>

            <div className="mt-5 border-t border-rule pt-4">
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={work?.published ?? true}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#14140f]"
                />
                <span className="text-[13px]">
                  Sitede yayında
                  <span className="adm-note mt-0.5 block max-w-[62ch]">
                    Kapalıyken iş taslaktır; sitede görünmez.
                  </span>
                </span>
              </label>
            </div>
          </div>

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
        </LiveEdit>

        <div className="flex items-center gap-3">
          <SaveButton />
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
