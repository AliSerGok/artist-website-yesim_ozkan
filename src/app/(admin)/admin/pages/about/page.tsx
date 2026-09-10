import { saveAboutAction } from "@/app/(admin)/admin/actions";
import { ImageField } from "@/components/admin/image-field";
import { getAbout } from "@/lib/content";
import type { AboutBlock } from "@/lib/types";

export const dynamic = "force-dynamic";

const FACT_SLOTS = [0, 1, 2, 3];

const BLOCK_LABEL: Record<AboutBlock["type"], string> = {
  text: "Metin",
  image: "Görsel",
  pair: "İkili görsel",
  quote: "Alıntı",
};

export default async function EditAbout() {
  const about = await getAbout();

  return (
    <>
      <h1 className="adm-h1">Hakkında</h1>
      <p className="adm-note mt-3 max-w-[60ch]">
        Sayfa üstte portre ve künyeyle açılıyor, altında sıraladığın bloklar
        akıyor. Blok ekleme, taşıma ve silme düğmeleri formu da kaydeder, yani
        yazdıkların kaybolmaz.
      </p>

      <form action={saveAboutAction} className="mt-8 flex flex-col gap-6">
        <input type="hidden" name="blockCount" value={about.blocks.length} />

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

        <div className="adm-card">
          <ImageField
            name="portraitKey"
            prefix="pages/about"
            imageKey={about.portraitKey}
            label="Portre"
            ratio={0.84}
          />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="adm-label">
                Portre yer tutucusu (Türkçe)
              </span>
              <input
                name="portraitSlotTr"
                className="adm-input"
                defaultValue={about.portraitSlot.tr}
              />
            </label>
            <label className="block">
              <span className="adm-label">
                Portre yer tutucusu (İngilizce)
              </span>
              <input
                name="portraitSlotEn"
                className="adm-input"
                defaultValue={about.portraitSlot.en}
              />
            </label>
          </div>
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
          <span className="adm-label">Sayfa blokları</span>

          <div className="flex flex-col gap-4">
            {about.blocks.map((block, index) => (
              <div key={index} className="adm-card">
                <input
                  type="hidden"
                  name={`b${index}_type`}
                  value={block.type}
                />

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="label">
                    {index + 1}. blok · {BLOCK_LABEL[block.type]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      name="intent"
                      value={`move:${index}:up`}
                      className="adm-btn px-2.5"
                      disabled={index === 0}
                      aria-label="Yukarı taşı"
                    >
                      ↑
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value={`move:${index}:down`}
                      className="adm-btn px-2.5"
                      disabled={index === about.blocks.length - 1}
                      aria-label="Aşağı taşı"
                    >
                      ↓
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value={`delete:${index}`}
                      className="adm-btn adm-btn-danger"
                    >
                      Bloğu sil
                    </button>
                  </div>
                </div>

                <BlockFields block={block} index={index} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="adm-note mr-2">Blok ekle:</span>
            <button type="submit" name="intent" value="add:text" className="adm-btn">
              Metin
            </button>
            <button type="submit" name="intent" value="add:image" className="adm-btn">
              Görsel
            </button>
            <button type="submit" name="intent" value="add:pair" className="adm-btn">
              İkili görsel
            </button>
            <button type="submit" name="intent" value="add:quote" className="adm-btn">
              Alıntı
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            name="intent"
            value="save"
            className="adm-btn adm-btn-primary"
          >
            Kaydet
          </button>
        </div>
      </form>
    </>
  );
}

function BlockFields({
  block,
  index,
}: {
  block: AboutBlock;
  index: number;
}) {
  const at = (name: string) => `b${index}_${name}`;

  if (block.type === "text") {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="adm-label">Metin (Türkçe)</span>
          <textarea
            name={at("textTr")}
            className="adm-textarea"
            defaultValue={block.paragraphs.map((p) => p.tr).join("\n\n")}
            placeholder="Paragrafları boş satırla ayır."
          />
        </label>
        <label className="block">
          <span className="adm-label">Metin (İngilizce)</span>
          <textarea
            name={at("textEn")}
            className="adm-textarea"
            defaultValue={block.paragraphs.map((p) => p.en).join("\n\n")}
          />
        </label>
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Alıntı (Türkçe)</span>
            <textarea
              name={at("quoteTr")}
              className="adm-textarea min-h-[90px]"
              defaultValue={block.quote.tr}
            />
          </label>
          <label className="block">
            <span className="adm-label">Alıntı (İngilizce)</span>
            <textarea
              name={at("quoteEn")}
              className="adm-textarea min-h-[90px]"
              defaultValue={block.quote.en}
            />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Kaynak (Türkçe)</span>
            <input
              name={at("byTr")}
              className="adm-input"
              defaultValue={block.by.tr}
              placeholder="Argonotlar söyleşisi, 2025"
            />
          </label>
          <label className="block">
            <span className="adm-label">Kaynak (İngilizce)</span>
            <input
              name={at("byEn")}
              className="adm-input"
              defaultValue={block.by.en}
            />
          </label>
        </div>
      </div>
    );
  }

  const caption = (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block">
        <span className="adm-label">Alt yazı (Türkçe)</span>
        <input
          name={at("capTr")}
          className="adm-input"
          defaultValue={block.caption.tr}
        />
      </label>
      <label className="block">
        <span className="adm-label">Alt yazı (İngilizce)</span>
        <input
          name={at("capEn")}
          className="adm-input"
          defaultValue={block.caption.en}
        />
      </label>
    </div>
  );

  if (block.type === "image") {
    return (
      <div className="flex flex-col gap-5">
        <ImageField
          name={at("imageKey")}
          ratioName={at("ratio")}
          ratio={block.ratio}
          prefix="pages/about"
          imageKey={block.imageKey}
          label="Görsel"
        />
        {caption}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <ImageField
          name={at("imageKeyA")}
          ratioName={at("ratioA")}
          ratio={block.ratioA}
          prefix="pages/about"
          imageKey={block.imageKeyA}
          label="Soldaki görsel"
          previewHeight={150}
        />
        <ImageField
          name={at("imageKeyB")}
          ratioName={at("ratioB")}
          ratio={block.ratioB}
          prefix="pages/about"
          imageKey={block.imageKeyB}
          label="Sağdaki görsel"
          previewHeight={150}
        />
      </div>
      {caption}
    </div>
  );
}
