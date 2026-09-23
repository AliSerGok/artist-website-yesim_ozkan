import { saveContactAction } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { SaveButton } from "@/components/admin/save-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { getContact } from "@/lib/content";
import { revision } from "@/lib/revision";
import { MAX_CONTACT_ROWS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditContact() {
  const contact = await getContact();
  const full = contact.rows.length >= MAX_CONTACT_ROWS;

  return (
    <>
      <h1 className="adm-h1">İletişim</h1>

      <ActionForm
        action={saveContactAction}
        formKey={revision(contact)}
        className="mt-8 flex flex-col gap-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Giriş cümlesi (Türkçe)</span>
            <input
              name="leadTr"
              className="adm-input"
              defaultValue={contact.lead.tr}
            />
          </label>
          <label className="block">
            <span className="adm-label">Giriş cümlesi (İngilizce)</span>
            <input
              name="leadEn"
              className="adm-input"
              defaultValue={contact.lead.en}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Not (Türkçe)</span>
            <textarea
              name="noteTr"
              className="adm-textarea"
              defaultValue={contact.note.tr}
            />
          </label>
          <label className="block">
            <span className="adm-label">Not (İngilizce)</span>
            <textarea
              name="noteEn"
              className="adm-textarea"
              defaultValue={contact.note.en}
            />
          </label>
        </div>

        <div>
          <input type="hidden" name="rowCount" value={contact.rows.length} />
          <span className="adm-label">Satırlar</span>

          <div className="flex flex-col gap-4">
            {contact.rows.map((row, index) => {
              // An empty row is one just added; it goes without being asked.
              const filled = Boolean(row.label.tr || row.value);

              return (
                <div key={index} className="adm-card">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="label">{index + 1}. satır</span>
                    <SubmitButton
                      name="intent"
                      value={`delete:${index}`}
                      className="adm-btn adm-btn-danger"
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

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]">
                    <label className="block">
                      <span className="adm-label">Etiket (TR)</span>
                      <input
                        name={`rowLabelTr${index}`}
                        className="adm-input"
                        defaultValue={row.label.tr}
                        placeholder="E-posta"
                      />
                    </label>
                    <label className="block">
                      <span className="adm-label">Etiket (EN)</span>
                      <input
                        name={`rowLabelEn${index}`}
                        className="adm-input"
                        defaultValue={row.label.en}
                        placeholder="Email"
                      />
                    </label>
                    <label className="block">
                      <span className="adm-label">Görünen değer</span>
                      <input
                        name={`rowValue${index}`}
                        className="adm-input"
                        defaultValue={row.value}
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
                </div>
              );
            })}
          </div>

          {contact.rows.length === 0 && (
            <p className="adm-note">Henüz satır yok.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SubmitButton name="intent" value="add" className="adm-btn" disabled={full}>
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
