import { FONTS, type Font, type TextStyle } from "@/lib/type-style";

/**
 * The face one written field is set in: the two the site is drawn with, and
 * seven plain ones every machine already has. Bold and italic ride along,
 * because they belong to the same choice.
 *
 * The three fields are named after the field they dress -- `styleTitleFont`,
 * `styleTitleBold`, `styleTitleItalic` -- which is what the save reads back.
 */

const FONT_LABEL: Record<Font, string> = {
  default: "Sayfanın yüzü",
  serif: "Site başlık",
  sans: "Site metin",
  calibri: "Calibri",
  times: "Times New Roman",
  georgia: "Georgia",
  palatino: "Palatino",
  verdana: "Verdana",
  trebuchet: "Trebuchet MS",
  mono: "Daktilo",
};

export function TypeMenu({
  name,
  style,
  target,
  label = "Yazı tipi",
}: {
  /** The field this face belongs to, e.g. "styleTitle". */
  name: string;
  style: TextStyle;
  /** The part of the card's preview it dresses, as a selector. */
  target?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2.5 border-t border-rule pt-3">
      <label className="block w-[min(100%,190px)]">
        <span className="adm-label">{label}</span>
        <select
          name={`${name}Font`}
          className="adm-select"
          defaultValue={style.font}
          data-live="font"
          data-live-target={target}
        >
          {FONTS.map((font) => (
            <option key={font} value={font}>
              {FONT_LABEL[font]}
            </option>
          ))}
        </select>
      </label>

      <label className="adm-switch">
        <input
          type="checkbox"
          name={`${name}Bold`}
          defaultChecked={style.bold}
          data-live="bold"
          data-live-target={target}
        />
        <span className="font-semibold">Kalın</span>
      </label>

      <label className="adm-switch">
        <input
          type="checkbox"
          name={`${name}Italic`}
          defaultChecked={style.italic}
          data-live="italic"
          data-live-target={target}
        />
        <span className="italic">İtalik</span>
      </label>
    </div>
  );
}
