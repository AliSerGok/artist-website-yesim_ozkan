import { LANGS } from "./i18n";
import type { Lang } from "./i18n";

/**
 * The addresses the viewer pushes and reads back. They live together because
 * the two ends have to agree: the grid and the home page write a work into
 * the address, and both read it out again when Back or Forward is pressed.
 */

export const workHref = (lang: Lang, slug: string) =>
  `/${lang}/works/${slug}`;

export const seriesHref = (lang: Lang, slug: string) =>
  `/${lang}/series/${slug}`;

const WORK_PATH = new RegExp(`^/(?:${LANGS.join("|")})/works/([^/]+)$`);

/** The work a path names, or null when it names none. */
export function workInPath(pathname: string): string | null {
  return WORK_PATH.exec(pathname)?.[1] ?? null;
}
