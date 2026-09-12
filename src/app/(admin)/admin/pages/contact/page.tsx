import { saveContactAction } from "@/app/(admin)/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getContact } from "@/lib/content";

export const dynamic = "force-dynamic";

const ROW_SLOTS = [0, 1, 2, 3, 4, 5];

export default async function EditContact() {
  const contact = await getContact();

  return (
    <>
      <h1 className="adm-h1">İletişim</h1>

      <form action={saveContactAction} className="mt-8 flex flex-col gap-6">
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
          <span className="adm-label">Satırlar</span>
          <div className="flex flex-col gap-4">
            {ROW_SLOTS.map((index) => {
              const row = contact.rows[index];
              return (
                <div
                  key={index}
                  className="adm-card grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]"
                >
                  <label className="block">
                    <span className="adm-label">Etiket (TR)</span>
                    <input
                      name={`rowLabelTr${index}`}
                      className="adm-input"
                      defaultValue={row?.label.tr ?? ""}
                      placeholder="E-posta"
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Etiket (EN)</span>
                    <input
                      name={`rowLabelEn${index}`}
                      className="adm-input"
                      defaultValue={row?.label.en ?? ""}
                      placeholder="Email"
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Görünen değer</span>
                    <input
                      name={`rowValue${index}`}
                      className="adm-input"
                      defaultValue={row?.value ?? ""}
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Bağlantı</span>
                    <input
                      name={`rowHref${index}`}
                      className="adm-input"
                      defaultValue={row?.href ?? ""}
                      placeholder="mailto:… / https://…"
                    />
                  </label>
                </div>
              );
            })}
          </div>
          <p className="adm-note mt-2">
            Boş bıraktığın satır sitede görünmez.
          </p>
        </div>

        <div>
          <SubmitButton
            className="adm-btn adm-btn-primary"
            busyLabel="Kaydediliyor…"
          >
            Kaydet
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
