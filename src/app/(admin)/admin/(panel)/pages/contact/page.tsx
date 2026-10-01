import { saveContactAction } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  FieldCard,
  FieldPreview,
  LIVE_TEXT,
} from "@/components/admin/field-card";
import { LiveEdit } from "@/components/admin/live-edit";
import { SaveButton } from "@/components/admin/save-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { dress, TypeMenu } from "@/components/admin/type-menu";
import { getContact } from "@/lib/content";
import { styleAttrs } from "@/lib/type-style";
import { revision } from "@/lib/revision";
import { MAX_CONTACT_ROWS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditContact() {
  const contact = await getContact();
  const full = contact.rows.length >= MAX_CONTACT_ROWS;

  return (
    <>
      <h1 className="adm-h1">İletişim</h1>
      <p className="adm-note mt-3 max-w-[64ch]">
        Her kart sitede göründüğü gibi duruyor; yazmak için “Düzenle”ye bas.
        Aynı anda tek kart açık kalır, yazı tipini de aynı kartta seçersin.
      </p>

      <ActionForm
        action={saveContactAction}
        formKey={revision(contact)}
        className="mt-8 flex flex-col gap-5"
      >
        <LiveEdit>
          <FieldCard
            label="Giriş cümlesi"
            hint="Sayfanın açılış cümlesi ve yazı tipi"
            preview={
              <FieldPreview
                kind="title"
                value={contact.lead.tr}
                style={contact.styles.lead}
                empty="Giriş cümlesi yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Giriş cümlesi (Türkçe)</span>
                  <input
                    name="leadTr"
                    className="adm-input"
                    defaultValue={contact.lead.tr}
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                    {...dress("styleLead", contact.styles.lead)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Giriş cümlesi (İngilizce)</span>
                  <input
                    name="leadEn"
                    className="adm-input"
                    defaultValue={contact.lead.en}
                    data-live="line"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                    {...dress("styleLead", contact.styles.lead)}
                  />
                </label>
              </div>
              <TypeMenu
                name="styleLead"
                style={contact.styles.lead}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>

          <FieldCard
            label="Not"
            hint="Giriş cümlesinin altındaki metin ve yazı tipi"
            preview={
              <FieldPreview
                kind="prose"
                value={contact.note.tr}
                style={contact.styles.note}
                empty="Not yazılmadı."
              />
            }
          >
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="adm-label">Not (Türkçe)</span>
                  <textarea
                    name="noteTr"
                    className="adm-textarea"
                    defaultValue={contact.note.tr}
                    data-live="text"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="tr"
                    {...dress("styleNote", contact.styles.note)}
                  />
                </label>
                <label className="block">
                  <span className="adm-label">Not (İngilizce)</span>
                  <textarea
                    name="noteEn"
                    className="adm-textarea"
                    defaultValue={contact.note.en}
                    data-live="text"
                    data-live-target={LIVE_TEXT}
                    data-live-lang="en"
                    {...dress("styleNote", contact.styles.note)}
                  />
                </label>
              </div>
              <TypeMenu
                name="styleNote"
                style={contact.styles.note}
                target={LIVE_TEXT}
              />
            </div>
          </FieldCard>
        </LiveEdit>

        <div>
          <input type="hidden" name="rowCount" value={contact.rows.length} />
          <span className="adm-label">Satırlar</span>

          <LiveEdit>
            <div className="flex flex-col gap-4">
              {contact.rows.map((row, index) => {
                // An empty row is one just added; it goes without being asked.
                const filled = Boolean(row.label.tr || row.value);

                return (
                  <div key={index} className="adm-card" data-card>
                    <div className="adm-card-head mb-3">
                      <span className="label">{index + 1}. satır</span>
                      <span className="adm-lang">TR</span>
                      <SubmitButton
                        name="intent"
                        value={`delete:${index}`}
                        className="adm-btn adm-btn-danger ml-auto"
                        busyLabel="Siliniyor…"
                        confirm={
                          filled
                            ? `"${row.label.tr || row.value}" satırı silinsin mi? Bu geri alınamaz.`
                            : undefined
                        }
                      >
                        Sil
                      </SubmitButton>
                    </div>

                    {/* The row as the contact page sets it: a label on the
                      left, the value on the right in its chosen face. */}
                    <div
                      className="adm-preview mb-4 flex items-baseline justify-between gap-5"
                      data-preview
                    >
                      <span className="label adm-row-label">
                        {row.label.tr}
                      </span>
                      <span
                        className="adm-live-text font-serif text-[19px] leading-[1.2]"
                        {...styleAttrs(row.style)}
                      >
                        {row.value}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]">
                      <label className="block">
                        <span className="adm-label">Etiket (TR)</span>
                        <input
                          name={`rowLabelTr${index}`}
                          className="adm-input"
                          defaultValue={row.label.tr}
                          placeholder="E-posta"
                          data-live="line"
                          data-live-target=".adm-row-label"
                          data-live-lang="tr"
                        />
                      </label>
                      <label className="block">
                        <span className="adm-label">Etiket (EN)</span>
                        <input
                          name={`rowLabelEn${index}`}
                          className="adm-input"
                          defaultValue={row.label.en}
                          placeholder="Email"
                          data-live="line"
                          data-live-target=".adm-row-label"
                          data-live-lang="en"
                        />
                      </label>
                      <label className="block">
                        <span className="adm-label">Görünen değer</span>
                        <input
                          name={`rowValue${index}`}
                          className="adm-input"
                          defaultValue={row.value}
                          data-live="line"
                          data-live-target={LIVE_TEXT}
                          {...dress(`rowStyle${index}`, row.style)}
                        />
                      </label>
                      <label className="block">
                        <span className="adm-label">Bağlantı</span>
                        <input
                          name={`rowHref${index}`}
                          className="adm-input"
                          defaultValue={row.href}
                          placeholder="mailto:… / https://…"
                        />
                      </label>
                    </div>

                    <div className="mt-4">
                      <TypeMenu
                        name={`rowStyle${index}`}
                        style={row.style}
                        target={LIVE_TEXT}
                        label="Görünen değerin yazı tipi"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </LiveEdit>

          {contact.rows.length === 0 && (
            <p className="adm-note">Henüz satır yok.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SubmitButton
              name="intent"
              value="add"
              className="adm-btn"
              disabled={full}
            >
              Satır ekle
            </SubmitButton>
            <span className="adm-note">
              {full
                ? `En çok ${MAX_CONTACT_ROWS} satır olabilir.`
                : "Görünen değeri boş olan satır sitede görünmez."}
            </span>
          </div>
        </div>

        <div>
          <SaveButton />
        </div>
      </ActionForm>
    </>
  );
}
