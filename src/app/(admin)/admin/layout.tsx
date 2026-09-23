import type { Metadata } from "next";
import { Fraunces } from "next/font/google";

import { ToastProvider } from "@/components/admin/toast";

import "../../globals.css";

/* Sitenin yüzüyle aynı — gerekçesi (site)/[lang]/layout.tsx'te. */
const serif = Fraunces({
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yönetim — Yeşim Özkan",
  robots: { index: false, follow: false },
};

/**
 * The shell every page under /admin sits in, the login screen included — the
 * lock itself is one layer further in, at (panel)/layout.tsx, so that the way
 * in is the one address it does not guard.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={serif.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
