import Link from "next/link";

import { saveAboutAction } from "@/app/(admin)/admin/actions";
import { AboutBlockView, AboutHead } from "@/components/about-flow";
import { ActionForm } from "@/components/admin/action-form";
import { LiveEdit } from "@/components/admin/live-edit";
import { TypeMenu } from "@/components/admin/type-menu";
import { ImageField } from "@/components/admin/image-field";
import { SaveButton } from "@/components/admin/save-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAbout, getCvSections, type CvSection } from "@/lib/content";
import { revision } from "@/lib/revision";
import {
  ALIGNMENTS,
  MAX_CELLS,
  SIZES,
  WIDTHS,
  type AboutBlock,
  type AboutContent,
  type AboutFact,
  type Alignment,
  type CvEntry,
  type RowCell,
  type Size,
  type Width,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Every card is one accordion: opening a card shuts the one that was open,
 * so the panel is a column of previews with a single form in it. The browser
 * does the shutting; components/admin/live-about.tsx holds the scroll still
 * while it happens.
 */
const FOLD_GROUP = "about-card";

const BLOCK_LABEL: Record<AboutBlock["type"], string> = {
  row: "Şerit",
  heading: "Başlık",
  quote: "Alıntı",
  cv: "Katılımlar",
};

/** What opening a card gets you, said before it is opened. */
const BLOCK_HINT: Record<AboutBlock["type"], string> = {
  row: "Alanların metni, görseli, genişliği ve hizalaması",
  heading: "Başlık yazısı, genişliği ve hizalaması",
  quote: "Alıntı, kaynağı, genişliği ve hizalaması",
  cv: "Liste başlığı ve satırlar",
};

const CELL_LABEL: Record<RowCell["kind"], string> = {
  text: "Metin",
  image: "Görsel",
};

const KIND_LABEL: Record<CvEntry["kind"], string> = {
  solo: "kişisel",
  group: "grup",
  "": "",
};

const WIDTH_LABEL: Record<Width, string> = {
  narrow: "Dar",
  medium: "Orta",
  wide: "Geniş",
  full: "Tam genişlik",
};

const ALIGN_LABEL: Record<Alignment, string> = {
  start: "Sola yaslı",
  center: "Ortalı",
  end: "Sağa yaslı",
};

const SIZE_LABEL: Record<Size, string> = {
  small: "Küçük",
  normal: "Normal",
  large: "Büyük",
  huge: "Çok büyük",
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

/** The chip that opens a card, and the line that says what is behind it. */
function FoldHead({ hint }: { hint: string }) {
  return (
    <summary>
      <span className="adm-btn shrink-0">
        <span data-fold="shut">Düzenle</span>
        <span data-fold="open">Kapat</span>
      </span>
      <span className="adm-note min-w-0 flex-1 truncate">{hint}</span>
    </summary>
  );
}

/** Everything a block can be given beyond its words. */
function Shape({
  prefix,
  width,
  align,
  size,
  sizeTarget,
  note,
}: {
  prefix: string;
  width: Width;
  align: Alignment;
  size: Size;
  /** Which part of the preview the size belongs to; the rest is the block. */
  sizeTarget: string;
  note: string;
}) {
  return (
    <div className="border-t border-rule pt-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="adm-label">Genişlik</span>
          <select
            name={`${prefix}width`}
            className="adm-select"
            defaultValue={width}
            data-live="width"
          >
            {WIDTHS.map((value) => (
              <option key={value} value={value}>
                {WIDTH_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="adm-label">Yatay</span>
          <select
            name={`${prefix}align`}
            className="adm-select"
            defaultValue={align}
            data-live="align"
          >
            {ALIGNMENTS.map((value) => (
              <option key={value} value={value}>
                {ALIGN_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="adm-label">Yazı boyutu</span>
          <select
            name={`${prefix}size`}
            className="adm-select"
            defaultValue={size}
            data-live="size"
            data-live-target={sizeTarget}
          >
            {SIZES.map((value) => (
              <option key={value} value={value}>
                {SIZE_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="adm-note mt-2">{note}</p>
    </div>
  );
}

/** A field with nothing in it yet is one the artist is still on. */
function cellIsBlank(cell: RowCell): boolean {
  return cell.kind === "text"
    ? cell.paragraphs.every((paragraph) => !paragraph.tr && !paragraph.en)
    : cell.imageKey === null;
}

/**
 * Which cards open by themselves. A block still missing something is one the
 * artist has just made or just added a field to, so it opens on its fields;
 * everything else stays folded away behind its own picture of the page.
 */
function blockIsBlank(block: AboutBlock): boolean {
  if (block.type === "heading") return !block.text.tr && !block.text.en;
  if (block.type === "quote") return !block.quote.tr && !block.quote.en;
  if (block.type === "cv") return false;
  return block.cells.some(cellIsBlank);
}

const factIsBlank = (fact: AboutFact) =>
  !fact.label.tr && !fact.label.en && fact.lines.length === 0;

export default async function EditAbout() {
  const [about, cv] = await Promise.all([getAbout(), getCvSections()]);
  const hasCvBlock = about.blocks.some((block) => block.type === "cv");

  return (
    <>
      <h1 className="adm-h1">Hakkında</h1>
      <p className="adm-note mt-3 max-w-[64ch]">
        Her kart sayfada göründüğü gibi duruyor; yazmak için “Düzenle”ye bas,
        alanlar kartın altında açılır. Aynı anda tek bir kart açık kalır, yeni
        birini açtığında öteki kapanır ve sayfa yerinden oynamaz. Genişliği,
        yaslanmayı ve yazı boyutunu değiştirdiğin anda üstteki önizlemede
        görürsün — kaydetmeni beklemez. Blokları ok düğmeleriyle yukarı aşağı
        taşıyorsun; ekleme, taşıma ve silme düğmeleri formu da kaydeder, yani
        yazdıkların kaybolmaz.
      </p>

      <ActionForm
        action={saveAboutAction}
        formKey={revision(about)}
        className="mt-8 flex flex-col gap-6"
      >
        <input type="hidden" name="blockCount" value={about.blocks.length} />
        <input type="hidden" name="factCount" value={about.facts.length} />

        <LiveEdit>
          <HeadCard about={about} />

          <div>
            <span className="adm-label">Sayfa blokları</span>

            <div className="flex flex-col gap-4">
              {about.blocks.map((block, index) => (
                <BlockCard
                  key={index}
                  block={block}
                  index={index}
                  count={about.blocks.length}
                  cv={cv}
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="adm-note mr-2">Blok ekle:</span>
              <SubmitButton name="intent" value="add:row" className="adm-btn">
                Şerit
              </SubmitButton>
              <SubmitButton
                name="intent"
                value="add:heading"
                className="adm-btn"
              >
                Başlık
              </SubmitButton>
              <SubmitButton name="intent" value="add:quote" className="adm-btn">
                Alıntı
              </SubmitButton>
              <SubmitButton
                name="intent"
                value="add:cv"
                className="adm-btn"
                disabled={hasCvBlock}
              >
                Katılımlar
              </SubmitButton>
              {hasCvBlock && (
                <span className="adm-note">
                  Katılım listesi sayfada bir kez görünür.
                </span>
              )}
            </div>
          </div>
        </LiveEdit>

        <div>
          <SaveButton name="intent" value="save" />
        </div>
      </ActionForm>
    </>
  );
}

/** The top of the page: portrait, opening sentence, künye columns. */
function HeadCard({ about }: { about: AboutContent }) {
  const open = !about.lead.tr || about.facts.some(factIsBlank);

  return (
    <div className="adm-card flex flex-col gap-4" data-card>
      <span className="label">Sayfa başı</span>

      <div className="adm-preview" data-preview>
        <AboutHead about={about} lang="tr" />
      </div>

      <details
        className="adm-fold border-t border-rule pt-3.5"
        name={FOLD_GROUP}
        open={open}
      >
        <FoldHead hint="Portre, giriş cümlesi ve künye sütunları" />

        <div className="mt-5 flex flex-col gap-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="adm-label">Giriş cümlesi (Türkçe)</span>
              <input
                name="leadTr"
                className="adm-input"
                defaultValue={about.lead.tr}
                data-live="line"
                data-live-target=".ab-lead"
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

          <TypeMenu
            name="leadStyle"
            style={about.leadStyle}
            target=".ab-lead"
            label="Giriş cümlesinin yazı tipi"
          />

          <div className="border border-rule p-4">
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
              {about.facts.map((fact, index) => (
                <div key={index} className="border border-rule p-4">
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
                        defaultValue={fact.lines
                          .map((line) => line.tr)
                          .join("\n")}
                        placeholder="Her satıra bir şey yaz."
                      />
                    </label>
                    <label className="block">
                      <span className="adm-label">Satırlar (EN)</span>
                      <textarea
                        name={`factLines${index}En`}
                        className="adm-textarea min-h-[84px]"
                        defaultValue={fact.lines
                          .map((line) => line.en)
                          .join("\n")}
                      />
                    </label>
                  </div>

                  <div className="mt-4">
                    <TypeMenu
                      name={`factStyle${index}`}
                      style={fact.style}
                      target={`[data-fact="${index}"]`}
                      label="Satırların yazı tipi"
                    />
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
        </div>
      </details>
    </div>
  );
}

/** One block: what it will look like, and the fields behind it. */
function BlockCard({
  block,
  index,
  count,
  cv,
}: {
  block: AboutBlock;
  index: number;
  count: number;
  cv: CvSection[];
}) {
  const blank = blockIsBlank(block);

  return (
    <div className="adm-card flex flex-col gap-4" data-card>
      <input type="hidden" name={`b${index}_type`} value={block.type} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label">
          {index + 1}. blok · {BLOCK_LABEL[block.type]}
          {block.type === "row" && ` · ${block.cells.length} alan`}
        </span>
        <div className="flex items-center gap-1.5">
          <MoveButtons intent="move" index={index} count={count} />
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

      {/* Live editing writes straight onto this, so it is always the real
          thing -- an empty block fills in as the words are typed. */}
      <div className="adm-preview" data-preview>
        <AboutBlockView block={block} lang="tr" cv={cv} />
      </div>

      <details
        className="adm-fold border-t border-rule pt-3.5"
        name={FOLD_GROUP}
        open={blank}
      >
        <FoldHead hint={BLOCK_HINT[block.type]} />

        <div className="mt-5">
          <BlockFields block={block} index={index} cv={cv} />
        </div>
      </details>
    </div>
  );
}

function BlockFields({
  block,
  index,
  cv,
}: {
  block: AboutBlock;
  index: number;
  cv: CvSection[];
}) {
  const at = (name: string) => `b${index}_${name}`;

  if (block.type === "cv") {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Liste başlığı (Türkçe)</span>
            <input
              name={at("cvTitleTr")}
              className="adm-input"
              defaultValue={block.title.tr}
              placeholder="Tüm katılımlar"
            />
          </label>
          <label className="block">
            <span className="adm-label">Liste başlığı (İngilizce)</span>
            <input
              name={at("cvTitleEn")}
              className="adm-input"
              defaultValue={block.title.en}
              placeholder="Curriculum vitae"
            />
          </label>
        </div>

        <TypeMenu
          name={at("style")}
          style={block.style}
          target=".ab-cv-title"
          label="Başlığın yazı tipi"
        />

        <p className="adm-note">
          Başlığı boş bırakırsan liste başlıksız akar. Satırların kendisi
          “Katılımlar” bölümünde yazılıyor; bu blok listenin sayfadaki yerini ve
          adını tutar. Aşağıdaki bağlantılar yeni sekmede açılır, burada
          yazdıkların kaybolmaz.
        </p>

        <CvPreview sections={cv} />
      </div>
    );
  }

  if (block.type === "heading") {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="adm-label">Başlık (Türkçe)</span>
            <input
              name={at("headTr")}
              className="adm-input"
              defaultValue={block.text.tr}
              placeholder="Atölye"
              data-live="line"
              data-live-target=".ab-title"
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

        <TypeMenu name={at("style")} style={block.style} target=".ab-title" />

        <Shape
          prefix={at("")}
          width={block.width}
          align={block.align}
          size={block.size}
          sizeTarget=".ab-title"
          note="Genişlik başlığın kapladığı şeridi, hizalama hem şeridin sayfadaki yerini hem de yazının yaslanmasını, yazı boyutu da başlığın puntosunu belirler. Üstteki önizleme anında değişir."
        />
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
              data-live="line"
              data-live-target=".ab-quote"
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
              data-live="line"
              data-live-target=".ab-cite"
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

        <TypeMenu
          name={at("style")}
          style={block.style}
          target=".ab-quote"
          label="Alıntının yazı tipi"
        />

        <Shape
          prefix={at("")}
          width={block.width}
          align={block.align}
          size={block.size}
          sizeTarget=".ab-quote"
          note="Alıntı sayfanın en geniş bloklarından biri; dar bir genişlikle şiir gibi, tam genişlikle bir ara başlık gibi durur. Hizalama alıntıyı ve kaynağını birlikte taşır, yazı boyutu yalnız alıntının puntosunu değiştirir."
        />
      </div>
    );
  }

  const full = block.cells.length >= MAX_CELLS;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={at("cellCount")} value={block.cells.length} />

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

/** The lines this block will put on the page, as the site will show them. */
function CvPreview({ sections }: { sections: CvSection[] }) {
  const count = sections.reduce(
    (total, section) => total + section.entries.length,
    0,
  );

  return (
    <div className="border border-rule p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="label">
          Sitede görünecek satırlar{count > 0 && ` · ${count}`}
        </span>
        <div className="flex items-center gap-1.5">
          <Link href="/admin/cv/new" className="adm-btn" target="_blank">
            Satır ekle
          </Link>
          <Link href="/admin/cv" className="adm-btn" target="_blank">
            Katılımları düzenle
          </Link>
        </div>
      </div>

      {count === 0 ? (
        <p className="adm-note">
          Henüz katılım eklenmemiş; liste boş kaldığı sürece bu blok sitede
          görünmez.
        </p>
      ) : (
        <div className="flex max-h-[340px] flex-col gap-4 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.group?.id ?? "unfiled"}>
              <div className="label mb-1.5">
                {section.group ? section.group.title.tr : "Başlıksız"}
              </div>

              {section.entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/admin/cv/${entry.id}`}
                  target="_blank"
                  className="grid items-baseline gap-3 border-b border-rule py-1.5 text-[13px] hover:text-mute [grid-template-columns:52px_minmax(0,1fr)_auto]"
                >
                  <span className="font-mono text-[11px] tracking-[0.12em] text-mute-3">
                    {entry.year}
                  </span>
                  <span className="min-w-0">{entry.title.tr}</span>
                  <span className="adm-note">{KIND_LABEL[entry.kind]}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Says what the two menus will and will not move, so nobody sets one and
 * waits for something to happen that cannot.
 */
function alignHint(cell: RowCell, count: number): string {
  const lines =
    cell.kind === "image"
      ? ["Görsel sütununu boydan boya kaplar; yatay hizalama alt yazıyı taşır."]
      : [
          "Genişlik metnin satır uzunluğunu, yazı boyutu puntosunu belirler; yatay hizalama hem metni hem de kutusunu sütun içinde yaslar.",
        ];

  lines.push(
    count === 1
      ? "Dikey hizalama, şeritte yan yana birden çok alan varken görünür."
      : "Dikey hizalama alanı, yanındaki en uzun alana göre yerleştirir.",
  );

  return lines.join(" ");
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
  // Which field of the preview strip above this card the menus speak for.
  const part = `.strip > :nth-child(${position + 1})`;

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
              data-live="text"
              data-live-target={part}
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

      <div className="mt-4 border-t border-rule pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {cell.kind === "text" && (
            <>
              <label className="block">
                <span className="adm-label">Genişlik</span>
                <select
                  name={on("width")}
                  className="adm-select"
                  defaultValue={cell.width}
                  data-live="width"
                  data-live-target={part}
                >
                  {WIDTHS.map((value) => (
                    <option key={value} value={value}>
                      {WIDTH_LABEL[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="adm-label">Yazı boyutu</span>
                <select
                  name={on("size")}
                  className="adm-select"
                  defaultValue={cell.size}
                  data-live="size"
                  data-live-target={part}
                >
                  {SIZES.map((value) => (
                    <option key={value} value={value}>
                      {SIZE_LABEL[value]}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block">
            <span className="adm-label">Yatay</span>
            <select
              name={on("alignX")}
              className="adm-select"
              defaultValue={cell.align.x}
              data-live="align"
              data-live-target={part}
            >
              {ALIGNMENTS.map((value) => (
                <option key={value} value={value}>
                  {ALIGN_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="adm-label">Dikey</span>
            <select
              name={on("alignY")}
              className="adm-select"
              defaultValue={cell.align.y}
              data-live="alignY"
              data-live-target={part}
            >
              <option value="start">Üste yaslı</option>
              <option value="center">Ortalı</option>
              <option value="end">Alta yaslı</option>
            </select>
          </label>
        </div>
        <p className="adm-note mt-2">{alignHint(cell, count)}</p>
      </div>

      <div className="mt-4">
        <TypeMenu
          name={on("style")}
          style={cell.style}
          target={part}
          label={cell.kind === "text" ? "Yazı tipi" : "Alt yazının yazı tipi"}
        />
      </div>
    </div>
  );
}
