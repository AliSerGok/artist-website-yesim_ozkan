import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteExhibitionAction,
  saveExhibitionAction,
} from "@/app/(admin)/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageField } from "@/components/admin/image-field";
import { LiveEdit } from "@/components/admin/live-edit";
import { SaveButton } from "@/components/admin/save-button";
import { dress } from "@/components/admin/type-menu";
import { getExhibitionById } from "@/lib/content";
import { styleAttrs } from "@/lib/type-style";
import { EXHIBITION_STYLES } from "@/lib/types";

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

  const styles = exhibition?.styles ?? EXHIBITION_STYLES;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1" {...styleAttrs(styles.title)}>
          {isNew ? "Yeni sergi" : exhibition!.title.tr}
        </h1>
        <Link href="/admin/exhibitions" className="adm-btn">
          Sergilere dön
        </Link>
      </div>

      <p className="adm-note mt-3 max-w-[64ch]">
        Buradaki sergiler, sergiler sayfasında görseli ve metniyle birlikte öne
        çıkar. Sadece listede görünmesini istediğin katılımlar için “Katılımlar”
        bölümünü kullan. Üstteki kutu sergiyi sitede göründüğü gibi gösterir;
        yazdıkça değişir. Yazı tipi burada seçilmez — bütün sergiler aynı yüzle
        yazılır, onu{" "}
        <Link href="/admin/exhibitions" className="underline">
          Sergiler
        </Link>{" "}
        sayfasının başındaki karttan değiştirirsin.
      </p>

      <form action={saveExhibitionAction} className="mt-8 flex flex-col gap-5">
        {exhibition && <input type="hidden" name="id" value={exhibition.id} />}

        <LiveEdit>
          <div className="adm-card flex flex-col gap-3.5" data-card>
            <div className="adm-card-head">
              <span className="label">Sergi yazıları</span>
              <span className="adm-lang">TR</span>
            </div>

            {/* The show as the exhibitions page writes it: year and kind on
                one line, then the name, the place and the text. */}
            <div className="adm-preview" data-preview>
              <div className="mb-2 flex items-baseline gap-[14px]">
                <span
                  className="font-mono text-[10px] tracking-[0.16em]"
                  {...styleAttrs(styles.title)}
                >
                  {exhibition?.year || "————"}
                </span>
                <span
                  className="adm-live-kind text-[9.5px] tracking-[0.18em] text-mute-3 uppercase"
                  {...styleAttrs(styles.kind)}
                >
                  {exhibition?.kind.tr ?? ""}
                </span>
              </div>

              <div
                className="adm-live-title font-serif text-[20px] leading-[1.25]"
                {...styleAttrs(styles.title)}
              >
                {exhibition?.title.tr || (
                  <span className="text-mute-3">Sergi adı yazılmadı.</span>
                )}
              </div>

              <div
                className="adm-live-venue mt-1.5 text-[12.5px] tracking-[0.06em] text-mute-2"
                {...styleAttrs(styles.venue)}
              >
                {exhibition?.venue.tr ?? ""}
              </div>

              <div
                className="adm-live-note adm-prose mt-3 text-[14px] leading-[1.7] text-ink-soft"
                {...styleAttrs(styles.note)}
              >
                {(exhibition?.note.tr ?? "")
                  .split(/\n\s*\n/)
                  .filter((part) => part.trim())
                  .map((part, index) => (
                    <p key={index}>{part}</p>
                  ))}
              </div>
            </div>

            {/* Every field at once: a show is four short things to say, and
                folding each one away behind its own button only hid them. */}
            <div className="flex flex-col gap-5 border-t border-rule pt-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Sergi adı (Türkçe)</span>
                  <input
                    name="titleTr"
                    className="adm-input"
                    defaultValue={exhibition?.title.tr ?? ""}
                    required
                    data-live="line"
                    data-live-target=".adm-live-title"
                    data-live-lang="tr"
                    {...dress("styleTitle", styles.title)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Sergi adı (İngilizce)</span>
                  <input
                    name="titleEn"
                    className="adm-input"
                    defaultValue={exhibition?.title.en ?? ""}
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
                  <span className="adm-label">Mekân (Türkçe)</span>
                  <input
                    name="venueTr"
                    className="adm-input"
                    defaultValue={exhibition?.venue.tr ?? ""}
                    placeholder="Galeri Nev, İstanbul"
                    data-live="line"
                    data-live-target=".adm-live-venue"
                    data-live-lang="tr"
                    {...dress("styleVenue", styles.venue)}
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
                    data-live-target=".adm-live-venue"
                    data-live-lang="en"
                    {...dress("styleVenue", styles.venue)}
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
                    data-live="line"
                    data-live-target=".adm-live-kind"
                    data-live-lang="tr"
                    {...dress("styleKind", styles.kind)}
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
                    data-live-target=".adm-live-kind"
                    data-live-lang="en"
                    {...dress("styleKind", styles.kind)}
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
                    data-live="text"
                    data-live-target=".adm-live-note"
                    data-live-lang="tr"
                    {...dress("styleNote", styles.note)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Sergi metni (İngilizce)</span>
                  <textarea
                    name="noteEn"
                    className="adm-textarea"
                    defaultValue={exhibition?.note.en ?? ""}
                    data-live="text"
                    data-live-target=".adm-live-note"
                    data-live-lang="en"
                    {...dress("styleNote", styles.note)}
                  />
                </label>
              </div>
            </div>
          </div>
        </LiveEdit>

        <div className="adm-card">
          <div className="adm-card-head">
            <span className="label">Ayarlar</span>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[120px_minmax(0,1fr)]">
            <label className="block">
              <span className="adm-label">Yıl</span>
              <input
                name="year"
                className="adm-input"
                defaultValue={exhibition?.year ?? ""}
                placeholder="2026"
                required
                {...dress("styleTitle", styles.title)}
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
          </div>

          <div className="mt-5 border-t border-rule pt-4">
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                name="published"
                defaultChecked={exhibition?.published ?? true}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#14140f]"
              />
              <span className="text-[13px]">
                Sitede yayında
                <span className="adm-note mt-0.5 block max-w-[62ch]">
                  Kapalıyken sergi taslaktır; sitede görünmez.
                </span>
              </span>
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
