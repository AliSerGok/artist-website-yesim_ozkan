import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteExhibitionAction,
  saveExhibitionAction,
} from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  FieldCard,
  FieldPreview,
  LIVE_TEXT,
} from "@/components/admin/field-card";
import { ImageField } from "@/components/admin/image-field";
import { LiveEdit } from "@/components/admin/live-edit";
import { SaveButton } from "@/components/admin/save-button";
import { TypeMenu } from "@/components/admin/type-menu";
import { getExhibitionById } from "@/lib/content";
import { PLAIN } from "@/lib/type-style";

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

  const styles = exhibition?.styles ?? {
    title: PLAIN,
    venue: PLAIN,
    kind: PLAIN,
    note: PLAIN,
  };

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
        bölümünü kullan. Her kart sitede göründüğü gibi duruyor; yazmak için
        “Düzenle”ye bas, yazı tipini de aynı kartta seç.
      </p>

      <form action={saveExhibitionAction} className="mt-8 flex flex-col gap-5">
        {exhibition && <input type="hidden" name="id" value={exhibition.id} />}

        <LiveEdit>
          <FieldCard
            label="Sergi adı"
            hint="Türkçesi, İngilizcesi ve yazı tipi"
            open={isNew}
            preview={
              <FieldPreview
                kind="title"
                value={exhibition?.title.tr ?? ""}
                style={styles.title}
                empty="Sergi adı yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Sergi adı (Türkçe)</span>
                  <input
                    name="titleTr"
                    className="adm-input"
                    defaultValue={exhibition?.title.tr ?? ""}
                    required
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Sergi adı (İngilizce)</span>
                  <input
                    name="titleEn"
                    className="adm-input"
                    defaultValue={exhibition?.title.en ?? ""}
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
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
            label="Mekân"
            hint="Serginin yeri ve yazı tipi"
            preview={
              <FieldPreview
                value={exhibition?.venue.tr ?? ""}
                style={styles.venue}
                empty="Mekân yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Mekân (Türkçe)</span>
                  <input
                    name="venueTr"
                    className="adm-input"
                    defaultValue={exhibition?.venue.tr ?? ""}
                    placeholder="Galeri Nev, İstanbul"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Mekân (İngilizce)</span>
                  <input
                    name="venueEn"
                    className="adm-input"
                    defaultValue={exhibition?.venue.en ?? ""}
                    placeholder="Galeri Nev, Istanbul"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                  />
                </label>
              </div>
              <TypeMenu
                name="styleVenue"
                style={styles.venue}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <FieldCard
            label="Sergi türü"
            hint="Yılın yanındaki küçük satır ve yazı tipi"
            preview={
              <FieldPreview
                value={exhibition?.kind.tr ?? ""}
                style={styles.kind}
                empty="Tür yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Sergi türü (Türkçe)</span>
                  <input
                    name="kindTr"
                    className="adm-input"
                    defaultValue={exhibition?.kind.tr ?? ""}
                    placeholder="Kişisel sergi"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Sergi türü (İngilizce)</span>
                  <input
                    name="kindEn"
                    className="adm-input"
                    defaultValue={exhibition?.kind.en ?? ""}
                    placeholder="Solo exhibition"
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                  />
                </label>
              </div>
              <TypeMenu
                name="styleKind"
                style={styles.kind}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <FieldCard
            label="Sergi metni"
            hint="Sergiler sayfasındaki metin ve yazı tipi"
            preview={
              <FieldPreview
                kind="prose"
                value={exhibition?.note.tr ?? ""}
                style={styles.note}
                empty="Metin yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Sergi metni (Türkçe)</span>
                  <textarea
                    name="noteTr"
                    className="adm-textarea"
                    defaultValue={exhibition?.note.tr ?? ""}
                    data-live="text"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Sergi metni (İngilizce)</span>
                  <textarea
                    name="noteEn"
                    className="adm-textarea"
                    defaultValue={exhibition?.note.en ?? ""}
                    data-live="text"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
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
        </LiveEdit>

        <div className="adm-card">
          <div className="adm-card-head">
            <span className="label">Yıl, bağlantı ve yayın</span>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[120px_minmax(0,1fr)_auto]">
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
        </div>

        <div className="adm-card">
          <ImageField
            name="imageKey"
            /*
             * A show that does not exist yet still needs somewhere to put its
             * picture. The upload only ever hands back a key; writing that key
             * onto a record is the save's job either way, so a new show simply
             * files its image under exhibitions/new.
             */
            prefix={
              exhibition ? `exhibitions/${exhibition.id}` : "exhibitions/new"
            }
            imageKey={exhibition?.imageKey ?? null}
            label="Sergi görseli"
            hint="Sergiler sayfasında 3:2 oranında kırpılarak gösterilir."
            ratio={1.5}
            cropRatio={1.5}
          />
        </div>

        <div className="flex items-center gap-3">
          <SaveButton />
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
