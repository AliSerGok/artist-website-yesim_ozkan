export const LANGS = ["tr", "en"] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "tr";

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** Every translatable string is stored as one record per language. */
export type Localized = Record<Lang, string>;

export function pick(value: Localized, lang: Lang): string {
  return value[lang];
}
