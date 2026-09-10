"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const [menuOpen, setMenuOpen] = useState(false);

  /** Path inside the language, e.g. "/works/esik" — kept when switching language. */
  const rest = pathname.replace(/^\/(tr|en)/, "");

  const active: Section = rest.startsWith("/exhibitions")
    ? "exhibitions"
    : rest.startsWith("/about")
      ? "about"
      : rest.startsWith("/contact")
        ? "contact"
        : "works";

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const langLinks = (size: "bar" | "menu") => (
    <>
      <Link
        href={`/tr${rest}`}
        hrefLang="tr"
        className={
          size === "bar"
            ? "text-[10.5px] tracking-[0.14em] transition-colors duration-200"
            : "px-1 py-2 text-[11px] tracking-[0.16em]"
        }
        style={{
          color: lang === "tr" ? "var(--color-ink)" : "var(--color-mute-3)",
        }}
      >
        TR
      </Link>
      <span
        className={
          size === "bar" ? "text-[10.5px] text-rule-2" : "text-[11px] text-rule-2"
        }
      >
        /
      </span>
      <Link
        href={`/en${rest}`}
        hrefLang="en"
        className={
          size === "bar"
            ? "text-[10.5px] tracking-[0.14em] transition-colors duration-200"
            : "px-1 py-2 text-[11px] tracking-[0.16em]"
        }
        style={{
          color: lang === "en" ? "var(--color-ink)" : "var(--color-mute-3)",
        }}
      >
        EN
      </Link>
    </>
  );

  return (
    <>
      <header className="hdr sticky top-0 z-40 flex flex-wrap items-baseline justify-between gap-6 border-b border-rule bg-[rgba(253,253,252,0.93)] backdrop-blur-[8px]">
        <Link
          href={`/${lang}`}
          data-perch=""
          className="hdr-name font-serif text-[24px] leading-none tracking-[0.005em]"
        >
          {t.siteName}
        </Link>

        <button
          type="button"
          className="burger -mr-2.5 h-11 w-11 cursor-pointer flex-col items-end justify-center gap-[5px] border-0 bg-transparent p-0"
          aria-label={t.menuLabel}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span
            className="block h-[1.5px] w-[22px] bg-ink transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: menuOpen
                ? "translateY(6.5px) rotate(45deg)"
                : undefined,
            }}
          />
          <span
            className="block h-[1.5px] w-[22px] bg-ink transition-opacity duration-200"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block h-[1.5px] w-[22px] bg-ink transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: menuOpen
                ? "translateY(-6.5px) rotate(-45deg)"
                : undefined,
            }}
          />
        </button>

        <div className="hdr-right flex items-baseline gap-[clamp(16px,3vw,34px)]">
          <nav className="flex items-baseline gap-[clamp(14px,2.4vw,30px)]">
            {SECTIONS.map(({ key, path }) => (
              <Link
                key={key}
                href={`/${lang}${path}`}
                data-perch=""
                className="nav-link"
                data-active={active === key}
              >
                {t.nav[key]}
              </Link>
            ))}
          </nav>

          <div className="flex items-baseline gap-[6px] border-l border-rule pl-[clamp(10px,2vw,22px)]">
            {langLinks("bar")}
          </div>
        </div>
      </header>

      {menuOpen && <MobileMenu lang={lang} active={active} rest={rest} />}
    </>
  );

  /** Rendered on <body>: the header's blur would otherwise trap a fixed child. */
  function MobileMenu({
    lang,
    active,
    rest,
  }: {
    lang: Lang;
    active: Section;
    rest: string;
  }) {
    void rest;
    return createPortal(
      <div className="fixed inset-0 z-70 flex animate-fade-up flex-col items-center justify-center gap-[30px] bg-bg">
        <nav className="flex flex-col items-center gap-[26px]">
          {SECTIONS.map(({ key, path }) => (
            <Link
              key={key}
              href={`/${lang}${path}`}
              className="px-2.5 py-1.5 font-serif text-[34px] leading-none"
              style={{
                color:
                  active === key ? "var(--color-ink)" : "var(--color-mute-2)",
              }}
              onClick={() => setMenuOpen(false)}
            >
              {t.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-[140px] items-center justify-center gap-2.5 border-t border-rule pt-[26px]">
          {langLinks("menu")}
        </div>
      </div>,
      document.body,
    );
  }
}
