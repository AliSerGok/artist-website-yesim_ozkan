import { saveHomeAction } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ImageField } from "@/components/admin/image-field";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { SaveButton } from "@/components/admin/save-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAllWorks, getHome } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { revision } from "@/lib/revision";
import type { HomeItem, Work } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<HomeItem["type"], string> = {
  work: "Site işi",
  image: "Yüklenen görsel",
  blank: "Seçilmedi",
};

interface Slot {
  item: HomeItem;
  /** Position in the saved list, which is what the field names are built from. */
  index: number;
}

/**
 * Two slides share one screen, so the panel lays them out the way the site
 * does: side by side, under the number of the screen they land on. The last
 * screen holds a single slide whenever the list has an odd length.
 */
function toScreens(items: HomeItem[]): Slot[][] {
  const screens: Slot[][] = [];

  items.forEach((item, index) => {
    if (index % 2 === 0) screens.push([]);
    screens[screens.length - 1].push({ item, index });
  });

  return screens;
}

export default async function EditHome() {
  const [home, works] = await Promise.all([getHome(), getAllWorks()]);
  const screens = toScreens(home.items);

  return (
    <>
      <h1 className="adm-h1">Ana sayfa</h1>
      <p className="adm-note mt-3 max-w-[64ch]">
        Ana sayfa bu ekranları altı saniyede bir çevirerek gösterir. Her ekranın
        bir solu bir de sağı var; yarısı boş kalan ekranı bölmez, dolu olan
        slayt ekranı boydan boya kaplar. Bir slayt ya sitedeki bir işi gösterir
        ya da yalnızca ana sayfa için yüklediğin bir görseli — sergiden bir
        kare, bir afiş, atölyeden bir fotoğraf. Ekranların sırasını
        başlıklarındaki tutamaçtan sürükleyerek değiştirirsin. Ekleme, taşıma
        ve silme düğmeleri formu da kaydeder, yani yazdıkların kaybolmaz.
      </p>

      <ActionForm
        action={saveHomeAction}
        formKey={revision(home)}
        className="mt-8 flex flex-col gap-6"
      >
        <input type="hidden" name="itemCount" value={home.items.length} />

        <SortableList
          className="flex flex-col gap-8"
          intent="screens"
          rows={screens.map((screen, screenIndex) => ({
            id: String(screenIndex),
            content: (
              <section className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <DragHandle
                    id={String(screenIndex)}
                    label="Ekranı sürükleyerek taşı"
                  />
                  <span className="label">{screenIndex + 1}. ekran</span>
                  <span className="h-px flex-1 bg-rule" />
                  <SubmitButton
                    name="intent"
                    value={`delete:screen:${screenIndex}`}
                    className="adm-btn adm-btn-danger"
                    busyLabel="Siliniyor…"
                  >
                    Ekranı sil
                  </SubmitButton>
                </div>

                <div className="grid items-start gap-4 lg:grid-cols-2">
                  {screen.map(({ item, index }) => (
                    <Slide
                      key={index}
                      item={item}
                      index={index}
                      total={home.items.length}
                      works={works}
                    />
                  ))}
                </div>
              </section>
            ),
          }))}
        />

        {home.items.length === 0 && (
          <p className="adm-note">
            Henüz slayt yok — ana sayfa şimdilik işler sayfasının başındaki altı
            işi gösteriyor.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton name="intent" value="add:screen" className="adm-btn">
            Ekran ekle
          </SubmitButton>
          <span className="adm-note">
            Yeni ekran iki boş yarımla, listenin sonuna eklenir; her yarıya ne
            koyacağını orada seçersin.
          </span>
        </div>

        <div>
          <SaveButton name="intent" value="save" />
        </div>
      </ActionForm>
    </>
  );
}

function Slide({
  item,
  index,
  total,
  works,
}: {
  item: HomeItem;
  index: number;
  total: number;
  works: Work[];
}) {
  return (
    // A container, so the fields inside answer to the width of this half
    // rather than to the width of the window.
    <div className="adm-card @container">
      <input type="hidden" name={`h${index}_type`} value={item.type} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="label">
          {index % 2 === 0 ? "Sol" : "Sağ"} · {TYPE_LABEL[item.type]}
        </span>
        <div className="flex items-center gap-1.5">
          <SubmitButton
            name="intent"
            value={`move:${index}:up`}
            className="adm-btn px-2.5"
            disabled={index === 0}
            aria-label="Öne al"
          >
            ↑
          </SubmitButton>
          <SubmitButton
            name="intent"
            value={`move:${index}:down`}
            className="adm-btn px-2.5"
            disabled={index === total - 1}
            aria-label="Geriye al"
          >
            ↓
          </SubmitButton>
          {item.type !== "blank" && (
            <SubmitButton
              name="intent"
              value={`clear:${index}`}
              className="adm-btn adm-btn-danger"
              busyLabel="Kaldırılıyor…"
              aria-label="Bu yarıyı boşalt"
            >
              Boşalt
            </SubmitButton>
          )}
        </div>
      </div>

      {item.type === "blank" ? (
        <BlankFields index={index} />
      ) : item.type === "work" ? (
        <WorkFields item={item} index={index} works={works} />
      ) : (
        <ImageFields item={item} index={index} />
      )}
    </div>
  );
}

/**
 * A slot that has been made but not yet told what it holds. Until it is, the
 * site passes over it and the slide beside it takes the whole screen.
 */
function BlankFields({ index }: { index: number }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="adm-label">Bu yarıda ne olsun?</span>

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          name="intent"
          value={`set:${index}:work`}
          className="adm-btn"
        >
          Sitedeki bir iş
        </SubmitButton>
        <SubmitButton
          name="intent"
          value={`set:${index}:image`}
          className="adm-btn"
        >
          Yeni görsel
        </SubmitButton>
      </div>

      <p className="adm-note">
        Bu yarı boş kaldığı sürece sitede görünmez; ekranı yanındaki slayt
        boydan boya kaplar. Ekranın tamamından kurtulmak için başlıktaki
        <strong> Ekranı sil</strong>.
      </p>
    </div>
  );
}

function WorkFields({
  item,
  index,
  works,
}: {
  item: Extract<HomeItem, { type: "work" }>;
  index: number;
  works: Work[];
}) {
  const chosen = works.find((work) => work.id === item.workId) ?? null;
  // A work deleted since it was chosen still keeps its place in the list.
  const deleted = item.workId !== "" && chosen === null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4">
        {chosen?.imageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(chosen.imageKey, "grid")}
            alt=""
            className="max-h-[76px] max-w-[118px] border border-rule object-contain"
          />
        ) : (
          // Holds the picture's place, so the menus line up across a screen.
          <span className="block h-[76px] w-[76px] border border-dashed border-rule" />
        )}

        <label className="block min-w-[min(100%,200px)] flex-1">
          <span className="adm-label">Hangi iş</span>
          <select
            name={`h${index}_workId`}
            className="adm-select"
            defaultValue={item.workId}
          >
            <option value="">— seç —</option>
            {deleted && <option value={item.workId}>— silinmiş iş —</option>}
            {works.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title.tr}, {work.year}
                {work.published ? "" : " · taslak"}
                {work.imageKey ? "" : " · görselsiz"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="adm-note">
        İşin adı, yılı ve tekniği slaytın üzerine kendiliğinden yazılır; slayt
        işin kendi sayfasına götürür.
        {item.workId === ""
          ? " Henüz iş seçilmedi; bu slayt sitede görünmez, yani ondan sonraki slaytlar bir sıra kayar."
          : ""}
        {chosen && !chosen.published
          ? " Bu iş taslak — yayına alınana kadar ana sayfada görünmez."
          : ""}
        {deleted ? " Seçtiğin iş artık yok; yerine başka bir iş seç." : ""}
      </p>
    </div>
  );
}

function ImageFields({
  item,
  index,
}: {
  item: Extract<HomeItem, { type: "image" }>;
  index: number;
}) {
  const at = (name: string) => `h${index}_${name}`;
  const named = item.title.tr || item.title.en;

  return (
    /*
     * Folded away until it is asked for. A closed <details> still hands its
     * fields to the form, so nothing typed is lost by shutting it, and the
     * form is rebuilt after a save that changed anything — which is what puts
     * every slide back to just its picture and its name.
     */
    <details className="adm-fold">
      <summary className="adm-fold-head">
        {item.imageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(item.imageKey, "grid")}
            alt=""
            className="max-h-[54px] max-w-[84px] border border-rule object-contain"
          />
        ) : (
          <span className="block h-[54px] w-[54px] border border-dashed border-rule" />
        )}

        <span className="min-w-0 flex-1 truncate text-[13.5px]">
          {named || (
            <span className="text-mute-2">Başlıksız görsel</span>
          )}
        </span>

        <span className="adm-btn shrink-0">
          <span data-fold="shut">Düzenle</span>
          <span data-fold="open">Kapat</span>
        </span>
      </summary>

      <div className="mt-5 flex flex-col gap-5">
      <ImageField
        // Remounts when a reorder puts a different picture in this slot, so
        // the preview and the hidden key never lag behind.
        key={item.imageKey ?? "empty"}
        name={at("imageKey")}
        ratioName={at("ratio")}
        ratio={item.ratio}
        prefix="pages/home"
        imageKey={item.imageKey}
        label="Görsel"
        previewHeight={150}
        hint="Ana sayfa görseli ekranı boydan boya kaplar, yatay ve geniş olanlar daha iyi durur. JPEG veya PNG yükle; tarayıcı web boyutuna küçültüp WebP’ye çevirir."
      />

      <div className="grid gap-4 @lg:grid-cols-2">
        <label className="block">
          <span className="adm-label">Başlık (Türkçe)</span>
          <input
            name={at("titleTr")}
            className="adm-input"
            defaultValue={item.title.tr}
            placeholder="Uzun Sabah"
          />
        </label>
        <label className="block">
          <span className="adm-label">Başlık (İngilizce)</span>
          <input
            name={at("titleEn")}
            className="adm-input"
            defaultValue={item.title.en}
            placeholder="The Long Morning"
          />
        </label>

        <label className="block">
          <span className="adm-label">Başlıktan sonra, italik (Türkçe)</span>
          <input
            name={at("asideTr")}
            className="adm-input"
            defaultValue={item.aside.tr}
            placeholder="2026"
          />
        </label>
        <label className="block">
          <span className="adm-label">Başlıktan sonra, italik (İngilizce)</span>
          <input
            name={at("asideEn")}
            className="adm-input"
            defaultValue={item.aside.en}
            placeholder="2026"
          />
        </label>

        <label className="block">
          <span className="adm-label">Alt satır (Türkçe)</span>
          <input
            name={at("captionTr")}
            className="adm-input"
            defaultValue={item.caption.tr}
            placeholder="Galeri Nev, İstanbul"
          />
        </label>
        <label className="block">
          <span className="adm-label">Alt satır (İngilizce)</span>
          <input
            name={at("captionEn")}
            className="adm-input"
            defaultValue={item.caption.en}
            placeholder="Galeri Nev, Istanbul"
          />
        </label>
      </div>

      <label className="block">
        <span className="adm-label">Bağlantı (isteğe bağlı)</span>
        <input
          name={at("href")}
          className="adm-input"
          defaultValue={item.href}
          placeholder="/tr/exhibitions · /tr/works/uzun-sabah · https://…"
        />
      </label>

        <p className="adm-note">
          Başlık ve alt satır görselin üzerine, tasarımdaki koyu geçişin içine
          yazılır; ikisini de boş bırakabilirsin. Bağlantı yazarsan slayt
          tıklanabilir olur. Görseli yüklenmemiş slayt sitede görünmez.
        </p>
      </div>
    </details>
  );
}
