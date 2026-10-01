import {
  FONT_GROUPS,
  styleAttrs,
  type Font,
  type FontGroup,
  type TextStyle,
} from "@/lib/type-style";

/**
 * The face one written field is set in: the two the site is drawn with, and
 * sixteen plain ones every machine already has, sorted into serifs, sans
 * faces and even-width ones so a long menu stays readable. Bold and italic
 * ride along, because they belong to the same choice.
 *
 * The three fields are named after the field they dress -- `styleTitleFont`,
 * `styleTitleBold`, `styleTitleItalic` -- which is what the save reads back.
 */

const FONT_LABEL: Record<Font, string> = {
  default: "Sayfanın yüzü",
  serif: "Site başlık",
  sans: "Site metin",
  times: "Times New Roman",
  georgia: "Georgia",
  palatino: "Palatino",
  garamond: "Garamond",
  baskerville: "Baskerville",
  didot: "Didot",
  calibri: "Calibri",
  verdana: "Verdana",
  trebuchet: "Trebuchet MS",
  tahoma: "Tahoma",
  optima: "Optima",
  futura: "Futura",
  gill: "Gill Sans",
  avenir: "Avenir",
  mono: "Daktilo",
  courier: "Courier",
};

/** The heading each kind of face is gathered under. */
const GROUP_LABEL: Record<FontGroup, string> = {
  site: "Sitenin yüzleri",
  serif: "Tırnaklı",
  sans: "Tırnaksız",
  mono: "Eşit aralıklı",
};

/**
 * What a written field wears while it is being typed: the face chosen for
 * it, so the box the words are typed into looks like the page they land on.
 * The name ties the field to its menu; the panel writes the same attributes
 * onto both as the menu is used.
 */
export function dress(name: string, style: TextStyle) {
  return { "data-dress": name, ...styleAttrs(style) };
}

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
          data-live-fields={`[data-dress="${name}"]`}
        >
          {FONT_GROUPS.map((group) => (
            <optgroup key={group.kind} label={GROUP_LABEL[group.kind]}>
              {group.fonts.map((font) => (
                <option key={font} value={font}>
                  {FONT_LABEL[font]}
                </option>
              ))}
            </optgroup>
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
          data-live-fields={`[data-dress="${name}"]`}
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
          data-live-fields={`[data-dress="${name}"]`}
        />
        <span className="italic">İtalik</span>
      </label>
    </div>
  );
}
