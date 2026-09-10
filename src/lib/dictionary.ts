import type { Lang } from "./i18n";
import type { Medium } from "./types";

interface Dictionary {
  siteName: string;
  nav: { works: string; exhibitions: string; about: string; contact: string };
  /** Technique filter labels, shared by the grid tabs and detail pages. */
  medium: Record<"all" | Medium, string>;
  mediumLabel: string;
  worksTitle: string;
  exhibitionsTitle: string;
  seriesBadge: string;
  cvTitle: string;
  fullList: string;
  visit: string;
  soloShort: string;
  groupShort: string;
  menuLabel: string;
  backToWorks: string;
  backToSeries: string;
  /** Viewer. */
  previous: string;
  next: string;
  close: string;
  readMore: string;
  collapse: string;
  noteHeading: string;
  hideNote: string;
  showNote: string;
  footerLeft: string;
  footerRight: string;
  noWorks: string;
}

export const DICTIONARY: Record<Lang, Dictionary> = {
  tr: {
    siteName: "Yeşim Özkan",
    nav: {
      works: "işler",
      exhibitions: "sergiler",
      about: "hakkında",
      contact: "iletişim",
    },
    medium: {
      all: "tümü",
      paintings: "resim",
      prints: "baskı",
      paper: "kağıt",
    },
    mediumLabel: "Teknik",
    worksTitle: "Seçilmiş işler",
    exhibitionsTitle: "Sergiler",
    seriesBadge: "seri",
    cvTitle: "Tüm katılımlar",
    fullList: "tüm liste — hakkında",
    visit: "sergi sayfası →",
    soloShort: "kişisel",
    groupShort: "grup",
    menuLabel: "menü",
    backToWorks: "← tüm işler",
    backToSeries: "← seriye dön",
    previous: "önceki",
    next: "sonraki",
    close: "kapat (esc)",
    readMore: "devamını oku",
    collapse: "kapat",
    noteHeading: "eser hakkında",
    hideNote: "bilgiyi gizle",
    showNote: "bilgiyi göster",
    footerLeft: "Yeşim Özkan — İstanbul",
    footerRight: "Tüm hakları saklıdır — 2026",
    noWorks: "Bu teknikte henüz iş yok.",
  },
  en: {
    siteName: "Yeşim Özkan",
    nav: {
      works: "works",
      exhibitions: "exhibitions",
      about: "about",
      contact: "contact",
    },
    medium: {
      all: "all",
      paintings: "paintings",
      prints: "prints",
      paper: "paper",
    },
    mediumLabel: "Medium",
    worksTitle: "Selected works",
    exhibitionsTitle: "Exhibitions",
    seriesBadge: "series",
    cvTitle: "All exhibitions",
    fullList: "full list — about",
    visit: "exhibition page →",
    soloShort: "solo",
    groupShort: "group",
    menuLabel: "menu",
    backToWorks: "← all works",
    backToSeries: "← back to series",
    previous: "previous",
    next: "next",
    close: "close (esc)",
    readMore: "read more",
    collapse: "close",
    noteHeading: "about the work",
    hideNote: "hide details",
    showNote: "show details",
    footerLeft: "Yeşim Özkan — Istanbul",
    footerRight: "All rights reserved — 2026",
    noWorks: "No works in this medium yet.",
  },
};

export function dict(lang: Lang) {
  return DICTIONARY[lang];
}
