/**
 * The face a piece of written text is set in, wherever the artist writes it:
 * a work's name, a caption, a paragraph of the about page, a line of the
 * contact list. The site's own two faces are the default, and the rest are
 * faces every machine already has, so nothing is downloaded and nothing
 * shifts while a page loads.
 *
 * Only the choice is kept here. What each name means is answered by
 * globals.css, which is also what lets the panel show a change the moment a
 * menu is used -- see components/admin/live-edit.tsx.
 */

/**
 * Every face on offer, in the order and the four kinds the menu shows them
 * in: the site's own, then the serifs, the sans faces, and the two even-width
 * ones. A face added here reaches the menu and the save on its own -- all
 * either reads is this list -- but it means nothing until globals.css
 * answers its name.
 */
export const FONT_GROUPS = [
  { kind: "site", fonts: ["default", "serif", "sans"] },
  {
    kind: "serif",
    fonts: ["times", "georgia", "palatino", "garamond", "baskerville", "didot"],
  },
  {
    kind: "sans",
    fonts: [
      "calibri",
      "verdana",
      "trebuchet",
      "tahoma",
      "optima",
      "futura",
      "gill",
      "avenir",
    ],
  },
  { kind: "mono", fonts: ["mono", "courier"] },
] as const;

/** Only how the menu sorts the faces -- nothing is stored about the kind. */
export type FontGroup = (typeof FONT_GROUPS)[number]["kind"];

export type Font = (typeof FONT_GROUPS)[number]["fonts"][number];

/** The same faces, flat: what a stored choice is checked against. */
export const FONTS: readonly Font[] = FONT_GROUPS.flatMap(
  (group) => group.fonts,
);

export interface TextStyle {
  /** "default" leaves the text in the face the page sets it in. */
  font: Font;
  bold: boolean;
  italic: boolean;
}

/** Nothing chosen: the page's own face, its own weight, upright. */
export const PLAIN: TextStyle = { font: "default", bold: false, italic: false };

/**
 * Nothing chosen either, but slanted: the face a year wears until the panel
 * says otherwise, which is how every year on the site was written before it
 * could be chosen at all.
 */
export const ITALIC: TextStyle = { font: "default", bold: false, italic: true };

const isFont = (value: unknown): value is Font =>
  typeof value === "string" && (FONTS as readonly string[]).includes(value);

/**
 * One style out of whatever was stored, which may be nothing at all. Nothing
 * stored means nothing was ever chosen, so the field keeps the face the page
 * has always given it; a style that *was* stored speaks for itself, upright
 * and unbold included.
 */
export function toStyle(value: unknown, fallback: TextStyle = PLAIN): TextStyle {
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<TextStyle>;

  return {
    font: isFont(raw.font) ? raw.font : "default",
    bold: raw.bold === true,
    italic: raw.italic === true,
  };
}

/** The styles of one row or block, keyed by the field each one dresses. */
export type StyleMap<Role extends string> = Record<Role, TextStyle>;

/**
 * The faces of one row out of whatever was stored, read against the faces its
 * fields wear when nothing has been chosen for them -- which is also the list
 * of the fields themselves, so a row restyled before it had a field cannot
 * come back missing one.
 */
export function toStyleMap<Role extends string>(
  value: unknown,
  defaults: StyleMap<Role>,
): StyleMap<Role> {
  const stored = (value ?? {}) as Record<string, unknown>;
  const map = {} as StyleMap<Role>;

  for (const role of rolesOf(defaults))
    map[role] = toStyle(stored[role], defaults[role]);

  return map;
}

/** The fields a row's faces are kept under, in the order they are named. */
export const rolesOf = <Role extends string>(defaults: StyleMap<Role>) =>
  Object.keys(defaults) as Role[];

/** Every field left in the page's own face. */
export const plainMap = <Role extends string>(roles: readonly Role[]) =>
  Object.fromEntries(roles.map((role) => [role, PLAIN])) as StyleMap<Role>;

/** A style is worth storing only when it says something. */
export const isPlain = (style: TextStyle) =>
  style.font === "default" && !style.bold && !style.italic;

/**
 * What the stylesheet reads. A style that says nothing writes nothing, so
 * the markup of a page nobody has restyled is the markup it always was.
 */
export function styleAttrs(style: TextStyle | undefined) {
  if (!style) return {};

  return {
    "data-font": style.font === "default" ? undefined : style.font,
    "data-bold": style.bold ? "true" : undefined,
    "data-italic": style.italic ? "true" : undefined,
  };
}

/**
 * The same, for a run of text written inside text that already wears a face
 * of its own -- the year after the name it belongs to. Here "unbold" and
 * "upright" have to be said out loud, or the line around it would keep saying
 * otherwise; globals.css answers both. The page's own face still means the
 * face of the line it sits in, which is the one it inherits.
 */
export function innerStyleAttrs(style: TextStyle | undefined) {
  if (!style) return {};

  return {
    "data-font": style.font === "default" ? undefined : style.font,
    "data-bold": style.bold ? "true" : "false",
    "data-italic": style.italic ? "true" : "false",
  };
}
