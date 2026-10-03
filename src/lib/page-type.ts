import {
  CV_STYLES,
  EXHIBITION_STYLES,
  SERIES_STYLES,
  WORK_STYLES,
} from "./types";

/**
 * Every work on the site is written the same way, and so is every series,
 * every show and every line of the participation list -- the way the home
 * page has always written every slide alike. One set of faces per kind, not
 * one per row.
 *
 * Each set is a row of the pages table, under the key named here, holding
 * `{ "styles": { ... } }` the way the home page's row does. Read by
 * lib/content, written by the panel's list page for that kind. The about
 * page is the exception and goes on keeping a face per block.
 */
export const TYPE_PAGES = {
  works: WORK_STYLES,
  series: SERIES_STYLES,
  exhibitions: EXHIBITION_STYLES,
  cv: CV_STYLES,
} as const;

export type TypePageKey = keyof typeof TYPE_PAGES;

/** The fields one kind of row has a face for, e.g. "title" | "year". */
export type TypeRole<Key extends TypePageKey> = keyof (typeof TYPE_PAGES)[Key] &
  string;
