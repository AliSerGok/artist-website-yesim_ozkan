import type { Lang, Localized } from "./i18n";
import type { Medium } from "./types";

interface Dictionary {
  siteName: string;
  nav: {
    home: string;
    works: string;
    exhibitions: string;
    about: string;
    contact: string;
  };
  /** Technique filter labels, shared by the grid tabs and detail pages. */
  medium: Record<"all" | Medium, string>;
  mediumLabel: string;
  worksTitle: string;
  exhibitionsTitle: string;
  seriesBadge: string;
  /** What a newly placed participation list is called until it is renamed. */
  cvTitle: string;
  fullList: string;
  visit: string;
  soloShort: string;
  groupShort: string;
  menuLabel: string;
  backToWorks: string;
  backToSeries: string;
  /** What a picture with no name of its own calls its own button. */
  enlarge: string;
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
      home: "ana sayfa",
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
      collage: "kolaj",
      photography: "fotoğraf",
      sculpture: "heykel",
      ceramics: "seramik",
      textile: "tekstil",
      installation: "enstalasyon",
      video: "video",
      digital: "dijital sanat",
      mixed: "karışık teknik",
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
    enlarge: "görseli büyüt",
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
      home: "home",
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
      collage: "collage",
      photography: "photography",
      sculpture: "sculpture",
      ceramics: "ceramics",
      textile: "textile",
      installation: "installation",
      video: "video",
      digital: "digital art",
      mixed: "mixed media",
    },
    mediumLabel: "Medium",
    worksTitle: "Selected works",
    exhibitionsTitle: "Exhibitions",
    seriesBadge: "series",
    cvTitle: "Curriculum vitae",
    fullList: "full list — about",
    visit: "exhibition page →",
    soloShort: "solo",
    groupShort: "group",
    menuLabel: "menu",
    backToWorks: "← all works",
    backToSeries: "← back to series",
    enlarge: "enlarge image",
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

/**
 * The heading a participation list starts life with. The block carries its
 * own title from then on, so this is a starting point and nothing else.
 */
export function defaultCvTitle(): Localized {
  return { tr: DICTIONARY.tr.cvTitle, en: DICTIONARY.en.cvTitle };
}

export function dict(lang: Lang) {
  return DICTIONARY[lang];
}
