import { saveAboutAction } from "@/app/(admin)/admin/actions";
import { ImageField } from "@/components/admin/image-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAbout } from "@/lib/content";
import { MAX_CELLS, type AboutBlock, type RowCell } from "@/lib/types";

export const dynamic = "force-dynamic";

const BLOCK_LABEL: Record<AboutBlock["type"], string> = {
  row: "Şerit",
  heading: "Başlık",
  quote: "Alıntı",
};

const CELL_LABEL: Record<RowCell["kind"], string> = {
  text: "Metin",
  image: "Görsel",
};

/** ↑ ↓ pair used by both the fact columns and the page blocks. */
function MoveButtons({
  intent,
  index,
  count,
  up = "up",
  down = "down",
  labels = ["Yukarı taşı", "Aşağı taşı"],
  glyphs = ["↑", "↓"],
}: {
  intent: string;
  index: number;
  count: number;
  up?: string;
  down?: string;
  labels?: [string, string];
  glyphs?: [string, string];
}) {
  return (
    <>
      <SubmitButton
        name="intent"
        value={`${intent}:${index}:${up}`}
        className="adm-btn px-2.5"
        disabled={index === 0}
        aria-label={labels[0]}
      >
        {glyphs[0]}
      </SubmitButton>
      <SubmitButton
        name="intent"
        value={`${intent}:${index}:${down}`}
        className="adm-btn px-2.5"
        disabled={index === count - 1}
        aria-label={labels[1]}
      >
        {glyphs[1]}
      </SubmitButton>
    </>
  );
}

export default async function EditAbout() {
  const about = await getAbout();

  return (
    <>
      <h1 className="adm-h1">Hakkında</h1>
      <p className="adm-note mt-3 max-w-[64ch]">
        Sayfa üstte portre ve künyeyle açılıyor, altında sıraladığın bloklar
        akıyor. Bir şerit bloğunda en çok {MAX_CELLS} alan olur ve her alan ya
        metin ya görseldir. Ekleme, taşıma ve silme düğmeleri formu da kaydeder,
        yani yazdıkların kaybolmaz.
      </p>

      <form action={saveAboutAction} className="mt-8 flex flex-col gap-6">
        <input type="hidden" name="blockCount" value={about.blocks.length} />
        <input type="hidden" name="factCount" value={about.facts.length} />

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
        </div>

        <div>
          <span className="adm-label">Künye sütunları</span>

          <div className="flex flex-col gap-4">
            {about.facts.map((fact, index) => (
              <div key={index} className="adm-card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="label">{index + 1}. sütun</span>
                  <div className="flex items-center gap-1.5">
                    <MoveButtons
                      intent="fact-move"
                      index={index}
                      count={about.facts.length}
                    />
                    <SubmitButton
                      name="intent"
                      value={`fact-delete:${index}`}
                      className="adm-btn adm-btn-danger"
                      busyLabel="Siliniyor…"
                    >
                      Sütunu sil
                    </SubmitButton>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="adm-label">Başlık (TR)</span>
                    <input
                      name={`factLabel${index}Tr`}
                      className="adm-input"
                      defaultValue={fact.label.tr}
                      placeholder="Eğitim"
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Başlık (EN)</span>
                    <input
                      name={`factLabel${index}En`}
                      className="adm-input"
                      defaultValue={fact.label.en}
                      placeholder="Education"
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Satırlar (TR)</span>
                    <textarea
                      name={`factLines${index}Tr`}
                      className="adm-textarea min-h-[84px]"
                      defaultValue={fact.lines.map((line) => line.tr).join("\n")}
                      placeholder="Her satıra bir şey yaz."
                    />
                  </label>
                  <label className="block">
                    <span className="adm-label">Satırlar (EN)</span>
                    <textarea
                      name={`factLines${index}En`}
                      className="adm-textarea min-h-[84px]"
                      defaultValue={fact.lines.map((line) => line.en).join("\n")}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SubmitButton name="intent" value="fact-add" className="adm-btn">
              Künye sütunu ekle
            </SubmitButton>
            <span className="adm-note">
              Sütunlar üstte, portrenin yanında yan yana dizilir; başlığı ve
              satırları boş kalan sütun sitede görünmez.
            </span>
          </div>
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
                    {block.type === "row" &&
                      ` · ${block.cells.length} alan`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <MoveButtons
                      intent="move"
                      index={index}
                      count={about.blocks.length}
                    />
                    <SubmitButton
                      name="intent"
                      value={`delete:${index}`}
                      className="adm-btn adm-btn-danger"
                      busyLabel="Siliniyor…"
                    >
                      Bloğu sil
                    </SubmitButton>
                  </div>
                </div>

                <BlockFields block={block} index={index} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="adm-note mr-2">Blok ekle:</span>
            <SubmitButton name="intent" value="add:row" className="adm-btn">
              Şerit
            </SubmitButton>
            <SubmitButton name="intent" value="add:heading" className="adm-btn">
              Başlık
            </SubmitButton>
            <SubmitButton name="intent" value="add:quote" className="adm-btn">
              Alıntı
            </SubmitButton>
          </div>
        </div>

        <div>
          <SubmitButton
            name="intent"
            value="save"
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

function BlockFields({ block, index }: { block: AboutBlock; index: number }) {
  const at = (name: string) => `b${index}_${name}`;

  if (block.type === "heading") {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="adm-label">Başlık (Türkçe)</span>
          <input
            name={at("headTr")}
            className="adm-input"
            defaultValue={block.text.tr}
            placeholder="Atölye"
          />
        </label>
        <label className="block">
          <span className="adm-label">Başlık (İngilizce)</span>
          <input
            name={at("headEn")}
            className="adm-input"
            defaultValue={block.text.en}
            placeholder="The studio"
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

  const full = block.cells.length >= MAX_CELLS;

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name={at("cellCount")}
        value={block.cells.length}
      />

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${block.cells.length}, minmax(0, 1fr))`,
        }}
      >
        {block.cells.map((cell, position) => (
          <CellFields
            key={position}
            cell={cell}
            block={index}
            position={position}
            count={block.cells.length}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="adm-note mr-1">Alan ekle:</span>
        <SubmitButton
          name="intent"
          value={`cell-add:${index}:text`}
          className="adm-btn"
          disabled={full}
        >
          Metin
        </SubmitButton>
        <SubmitButton
          name="intent"
          value={`cell-add:${index}:image`}
          className="adm-btn"
          disabled={full}
        >
          Görsel
        </SubmitButton>
        {full && (
          <span className="adm-note">
            Bir şeritte en çok {MAX_CELLS} alan olabilir.
          </span>
        )}
      </div>
    </div>
  );
}

function CellFields({
  cell,
  block,
  position,
  count,
}: {
  cell: RowCell;
  block: number;
  position: number;
  count: number;
}) {
  const on = (name: string) => `b${block}c${position}_${name}`;

  return (
    <div className="border border-rule p-4">
      <input type="hidden" name={on("kind")} value={cell.kind} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="label">
          {position + 1}. alan · {CELL_LABEL[cell.kind]}
        </span>
        <div className="flex items-center gap-1.5">
          <MoveButtons
            intent={`cell-move:${block}`}
            index={position}
            count={count}
            up="left"
            down="right"
            labels={["Sola taşı", "Sağa taşı"]}
            glyphs={["←", "→"]}
          />
          <SubmitButton
            name="intent"
            value={`cell-delete:${block}:${position}`}
            className="adm-btn adm-btn-danger px-2.5"
            disabled={count === 1}
            aria-label="Alanı sil"
          >
            ×
          </SubmitButton>
        </div>
      </div>

      {cell.kind === "text" ? (
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="adm-label">Metin (Türkçe)</span>
            <textarea
              name={on("textTr")}
              className="adm-textarea"
              defaultValue={cell.paragraphs.map((p) => p.tr).join("\n\n")}
              placeholder="Paragrafları boş satırla ayır."
            />
          </label>
          <label className="block">
            <span className="adm-label">Metin (İngilizce)</span>
            <textarea
              name={on("textEn")}
              className="adm-textarea"
              defaultValue={cell.paragraphs.map((p) => p.en).join("\n\n")}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ImageField
            // Remounts when a reorder puts a different picture in this slot,
            // so the preview and the hidden key never lag behind.
            key={cell.imageKey ?? "empty"}
            name={on("imageKey")}
            ratioName={on("ratio")}
            ratio={cell.ratio}
            prefix="pages/about"
            imageKey={cell.imageKey}
            label="Görsel"
            previewHeight={150}
          />
          <label className="block">
            <span className="adm-label">Alt yazı (Türkçe)</span>
            <input
              name={on("capTr")}
              className="adm-input"
              defaultValue={cell.caption.tr}
            />
          </label>
          <label className="block">
            <span className="adm-label">Alt yazı (İngilizce)</span>
            <input
              name={on("capEn")}
              className="adm-input"
              defaultValue={cell.caption.en}
            />
          </label>
        </div>
      )}
    </div>
  );
}
