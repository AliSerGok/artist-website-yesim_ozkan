import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminIdentity } from "@/lib/admin-auth";

import "../../globals.css";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yönetim — Yeşim Özkan",
  robots: { index: false, follow: false },
};

const TABS = [
  { href: "/admin/works", label: "İşler" },
  { href: "/admin/series", label: "Seriler" },
  { href: "/admin/exhibitions", label: "Sergiler" },
  { href: "/admin/cv", label: "Katılımlar" },
  { href: "/admin/pages/about", label: "Hakkında" },
  { href: "/admin/pages/contact", label: "İletişim" },
  { href: "/admin/settings", label: "Animasyonlar" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cloudflare Access already blocks unauthorised visitors before they reach
  // the app. This is the second lock: without a verified identity the panel
  // does not exist, and an unconfigured deployment answers 404 rather than
  // opening a door.
  const identity = await getAdminIdentity();
  if (!identity) notFound();

  return (
    <html lang="tr" className={serif.variable}>
      <body>
        <div className="adm-bar">
          <Link href="/admin" className="font-serif text-[20px] leading-none">
            Yönetim
          </Link>
          <nav className="flex flex-wrap items-baseline gap-[clamp(12px,2vw,24px)]">
            {TABS.map((tab) => (
              <Link key={tab.href} href={tab.href} className="nav-link">
                {tab.label}
              </Link>
            ))}
            <a href="/tr" className="nav-link" target="_blank" rel="noreferrer">
              Siteyi gör ↗
            </a>
          </nav>
          <span className="label">{identity?.email ?? "—"}</span>
        </div>
        <main className="adm-shell pt-[clamp(26px,4vw,44px)]">{children}</main>
      </body>
    </html>
  );
}
