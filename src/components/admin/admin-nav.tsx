"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { signOutAction } from "@/app/(admin)/admin/auth-actions";

const TABS = [
  { href: "/admin/pages/home", label: "Ana sayfa" },
  { href: "/admin/works", label: "İşler" },
  { href: "/admin/series", label: "Seriler" },
  { href: "/admin/exhibitions", label: "Sergiler" },
  { href: "/admin/cv", label: "Katılımlar" },
  { href: "/admin/pages/about", label: "Hakkında" },
  { href: "/admin/pages/contact", label: "İletişim" },
  { href: "/admin/account", label: "Hesap" },
];

/**
 * A dot that lights up between the click and the new page. Admin pages are
 * rendered on demand, so there is a real wait to account for.
 */
function Spark() {
  const { pending } = useLinkStatus();
  // Always in the layout, never moving anything — only its opacity changes.
  return <span className="nav-spark" data-pending={pending || undefined} />;
}

/** Three rules that fold into a cross once the menu is open. */
function Bars({ open }: { open: boolean }) {
  return (
    <>
      <span
        className="block h-[1.5px] w-[22px] bg-ink transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: open ? "translateY(6.5px) rotate(45deg)" : undefined,
        }}
      />
      <span
        className="block h-[1.5px] w-[22px] bg-ink transition-opacity duration-200"
        style={{ opacity: open ? 0 : 1 }}
      />
      <span
        className="block h-[1.5px] w-[22px] bg-ink transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: open ? "translateY(-6.5px) rotate(-45deg)" : undefined,
        }}
      />
    </>
  );
}

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  /** `/admin/works/new` still belongs to the İşler tab. */
  const isOn = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

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

  // Turning the phone can cross into the wide layout, where the burger is
  // gone — close rather than leave an overlay with no way out of it.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (wide.matches) setMenuOpen(false);
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <nav className="adm-nav">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="nav-link"
            data-active={isOn(tab.href)}
            aria-current={isOn(tab.href) ? "page" : undefined}
          >
            {tab.label}
            <Spark />
          </Link>
        ))}
        <a href="/tr" className="nav-link" target="_blank" rel="noreferrer">
          Siteyi gör ↗
        </a>
      </nav>

      <button
        type="button"
        className="burger"
        aria-label="Menü"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Bars open={menuOpen} />
      </button>

      {menuOpen && <MobileMenu />}
    </>
  );

  /**
   * Rendered on <body>: eight tabs, an address and a sign-out do not fit one
   * phone row, and wrapping them turned the sticky bar into a third of the
   * screen. The bar's own blur would trap a fixed child, hence the portal.
   */
  function MobileMenu() {
    return createPortal(
      <div className="adm-menu animate-fade-up">
        {/* Sits where the burger was, so the cross closes what it opened. */}
        <button
          type="button"
          className="burger adm-menu-close"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        >
          <Bars open />
        </button>

        <nav className="adm-menu-list flex flex-col items-center gap-[18px]">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="inline-flex items-baseline gap-2 px-2.5 py-1 font-serif text-[22px] leading-none"
              style={{
                color: isOn(tab.href)
                  ? "var(--color-ink)"
                  : "var(--color-mute-2)",
              }}
              aria-current={isOn(tab.href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {tab.label}
              <Spark />
            </Link>
          ))}
          <a
            href="/tr"
            className="px-2.5 py-1 font-serif text-[22px] leading-none"
            style={{ color: "var(--color-mute-2)" }}
            target="_blank"
            rel="noreferrer"
          >
            Siteyi gör ↗
          </a>
        </nav>

        <div className="adm-menu-foot flex flex-col items-center gap-3 border-t border-rule pt-[22px]">
          <span className="label">{email}</span>
          <form action={signOutAction}>
            <button type="submit" className="nav-link">
              Çıkış
            </button>
          </form>
        </div>
      </div>,
      document.body,
    );
  }
}
