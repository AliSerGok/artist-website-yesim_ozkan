import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteWorkAction, saveWorkAction } from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  FieldCard,
  FieldPreview,
  LIVE_TEXT,
} from "@/components/admin/field-card";
import { ImageField } from "@/components/admin/image-field";
import { LiveEdit } from "@/components/admin/live-edit";
import { SaveButton } from "@/components/admin/save-button";
import { dress, TypeMenu } from "@/components/admin/type-menu";
import { getAllSeries, getWorkById } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { styleAttrs } from "@/lib/type-style";
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
        Her kart sitede göründüğü gibi duruyor; yazmak için “Düzenle”ye bas.
        Aynı anda tek kart açık kalır. Her yazının kendi yazı tipi, kalını ve
        italiği var — seçtiğin anda kartın üstünde görürsün.
      </p>

      <form action={saveWorkAction} className="mt-8 flex flex-col gap-5">
        {work && <input type="hidden" name="id" value={work.id} />}

        <LiveEdit>
          <FieldCard
            label="Başlık"
            hint="Türkçesi, İngilizcesi ve yazı tipi"
            open={isNew}
            preview={
              <FieldPreview
                kind="title"
                value={work?.title.tr ?? ""}
                style={styles.title}
                empty="Başlık yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Başlık (Türkçe)</span>
                  <input
                    name="titleTr"
                    className="adm-input"
                    defaultValue={work?.title.tr ?? ""}
                    required
                    data-live="line"
                    data-live-target={LIVE_TEXT}
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
            label="Teknik ve ölçü"
            hint="Eserin altındaki künye satırı ve yazı tipi"
            preview={
              <FieldPreview
                value={work?.caption.tr ?? ""}
                style={styles.caption}
                empty="Künye yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Teknik ve ölçü (Türkçe)</span>
                  <input
                    name="captionTr"
                    className="adm-input"
                    defaultValue={work?.caption.tr ?? ""}
                    placeholder="Ketende yağlıboya, 120 × 90 cm"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
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
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                    {...dress("styleCaption", styles.caption)}
                  />
                </label>
              </div>
              <TypeMenu
                name="styleCaption"
                style={styles.caption}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <FieldCard
            label="Eser hakkında"
            hint="Büyütülmüş görünümde çıkan metin ve yazı tipi"
            preview={
              <FieldPreview
                kind="prose"
                value={work?.note.tr ?? ""}
                style={styles.note}
                empty="Metin yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Eser hakkında (Türkçe)</span>
                  <textarea
                    name="noteTr"
                    className="adm-textarea"
                    defaultValue={work?.note.tr ?? ""}
                    placeholder="Büyütülmüş görünümde eserin altında çıkan metin."
                    data-live="text"
                    data-live-target={LIVE_TEXT}
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

          {/* Not a card to open: four small settings, always in sight. */}
          <div className="adm-card">
            <div className="adm-card-head">
              <span className="label">Yıl, teknik, seri ve yayın</span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-4">
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

            {/*
              The year is written after the name wherever the work is shown, so
              it is set on its own: the name may be in one face and the year in
              another, slanted or upright, bold or not.
            */}
            <div className="mt-5">
              <TypeMenu
                name="styleYear"
                style={styles.year}
                label="Yılın yazı tipi"
              />
              <p className="adm-note mt-3 max-w-[62ch]">
                Yıl, eserin adından sonra virgülle yazılır — kartta, büyütülmüş
                görünümde ve eserin kendi sayfasında. Buradaki seçim yalnızca
                yılı etkiler; adın yüzü kendi kartında seçilir.
              </p>
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
