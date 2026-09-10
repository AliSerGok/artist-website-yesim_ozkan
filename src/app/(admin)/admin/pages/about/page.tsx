import { saveAboutAction } from "@/app/(admin)/admin/actions";
import { getAbout } from "@/lib/content";

export const dynamic = "force-dynamic";

const FACT_SLOTS = [0, 1, 2, 3];

export default async function EditAbout() {
  const about = await getAbout();

  const joined = (lang: "tr" | "en") =>
    about.paragraphs.map((paragraph) => paragraph[lang]).join("\n\n");

  return (
    <>
      <h1 className="adm-h1">Hakkında</h1>
      <p className="adm-note mt-3 max-w-[56ch]">
        Paragrafları tek kutuya yaz; aralarına boş satır bırakırsan sitede ayrı
        paragraf olurlar.
      </p>

      <form action={saveAboutAction} className="mt-8 flex flex-col gap-6">
        <input
          type="hidden"
          name="portraitKey"
          value={about.portraitKey ?? ""}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Giriş cümlesi (Türkçe)</span>
            <input
              name="leadTr"
              className="adm-input"
              defaultValue={about.lead.tr}
            />
          </label>
          <label className="block">
            <span className="adm-label">Giriş cümlesi (İngilizce)</span>
            <input
              name="leadEn"
              className="adm-input"
              defaultValue={about.lead.en}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Metin (Türkçe)</span>
            <textarea
              name="paragraphsTr"
              className="adm-textarea min-h-[260px]"
              defaultValue={joined("tr")}
            />
          </label>
          <label className="block">
            <span className="adm-label">Metin (İngilizce)</span>
            <textarea
              name="paragraphsEn"
              className="adm-textarea min-h-[260px]"
              defaultValue={joined("en")}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Portre yer tutucusu (Türkçe)</span>
            <input
              name="portraitSlotTr"
              className="adm-input"
              defaultValue={about.portraitSlot.tr}
            />
          </label>
          <label className="block">
            <span className="adm-label">Portre yer tutucusu (İngilizce)</span>
            <input
              name="portraitSlotEn"
              className="adm-input"
              defaultValue={about.portraitSlot.en}
            />
          </label>
        </div>

        <div>
          <span className="adm-label">Künye sütunları</span>
          <div className="flex flex-col gap-4">
            {FACT_SLOTS.map((index) => {
              const fact = about.facts[index];
              return (
                <div key={index} className="adm-card grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="adm-label">Başlık (TR)</span>
                    <input
                      name={`factLabelTr${index}`}
                      className="adm-input"
                      defaultValue={fact?.label.tr ?? ""}
                      placeholder="Eğitim"
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Başlık (EN)</span>
                    <input
                      name={`factLabelEn${index}`}
                      className="adm-input"
                      defaultValue={fact?.label.en ?? ""}
                      placeholder="Education"
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">1. satır (TR)</span>
                    <input
                      name={`factATr${index}`}
                      className="adm-input"
                      defaultValue={fact?.a.tr ?? ""}
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">1. satır (EN)</span>
                    <input
                      name={`factAEn${index}`}
                      className="adm-input"
                      defaultValue={fact?.a.en ?? ""}
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">2. satır (TR)</span>
                    <input
                      name={`factBTr${index}`}
                      className="adm-input"
                      defaultValue={fact?.b.tr ?? ""}
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">2. satır (EN)</span>
                    <input
                      name={`factBEn${index}`}
                      className="adm-input"
                      defaultValue={fact?.b.en ?? ""}
                    />
                  </label>
                </div>
              );
            })}
          </div>
          <p className="adm-note mt-2">
            Başlığı boş bıraktığın sütun sitede görünmez.
          </p>
        </div>

        <div>
          <button type="submit" className="adm-btn adm-btn-primary">
            Kaydet
          </button>
        </div>
      </form>
    </>
  );
}
