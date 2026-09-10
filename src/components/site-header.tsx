"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";

type Section = "works" | "exhibitions" | "about" | "contact";

const SECTIONS: { key: Section; path: string }[] = [
  { key: "works", path: "" },
  { key: "exhibitions", path: "/exhibitions" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
];

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const pathname = usePathname();
  /** Path inside the language, e.g. "/works/esik" — kept when switching language. */
  const rest = pathname.replace(/^\/(tr|en)/, "");

  const active: Section = rest.startsWith("/exhibitions")
    ? "exhibitions"
    : rest.startsWith("/about")
      ? "about"
      : rest.startsWith("/contact")
        ? "contact"
        : "works";

  return (
    <header className="gutter sticky top-0 z-40 flex flex-wrap items-baseline justify-between gap-6 border-b border-rule bg-[rgba(253,253,252,0.93)] pt-6 pb-4 backdrop-blur-[8px]">
      <Link
        href={`/${lang}`}
        className="font-serif text-[24px] leading-none tracking-[0.005em]"
      >
        {t.siteName}
      </Link>

      <div className="flex items-baseline gap-[clamp(16px,3vw,34px)]">
        <nav className="flex items-baseline gap-[clamp(14px,2.4vw,30px)]">
          {SECTIONS.map(({ key, path }) => (
            <Link
              key={key}
              href={`/${lang}${path}`}
              className="nav-link"
              data-active={active === key}
            >
              {t.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-baseline gap-[6px] border-l border-rule pl-[clamp(10px,2vw,22px)]">
          <Link
            href={`/tr${rest}`}
            hrefLang="tr"
            className="text-[10.5px] tracking-[0.14em] transition-colors duration-200"
            style={{
              color: lang === "tr" ? "var(--color-ink)" : "var(--color-mute-3)",
            }}
          >
            TR
          </Link>
          <span className="text-[10.5px] text-rule-2">/</span>
          <Link
            href={`/en${rest}`}
            hrefLang="en"
            className="text-[10.5px] tracking-[0.14em] transition-colors duration-200"
            style={{
              color: lang === "en" ? "var(--color-ink)" : "var(--color-mute-3)",
            }}
          >
            EN
          </Link>
        </div>
      </div>
    </header>
  );
}
