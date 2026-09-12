"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/works", label: "İşler" },
  { href: "/admin/series", label: "Seriler" },
  { href: "/admin/exhibitions", label: "Sergiler" },
  { href: "/admin/cv", label: "Katılımlar" },
  { href: "/admin/pages/about", label: "Hakkında" },
  { href: "/admin/pages/contact", label: "İletişim" },
  { href: "/admin/settings", label: "Animasyonlar" },
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

export function AdminNav() {
  const pathname = usePathname();

  /** `/admin/works/new` still belongs to the İşler tab. */
  const isOn = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex flex-wrap items-baseline gap-[clamp(12px,2vw,24px)]">
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
  );
}
