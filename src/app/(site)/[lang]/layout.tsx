import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";

import "../../globals.css";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = dict(lang);

  return {
    title: { default: t.siteName, template: `%s — ${t.siteName}` },
    description:
      lang === "tr"
        ? "Yeşim Özkan'ın resimleri, baskıları ve kağıt işleri."
        : "Paintings, prints and works on paper by Yeşim Özkan.",
    alternates: {
      canonical: `/${lang}`,
      languages: { tr: "/tr", en: "/en" },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} className={serif.variable}>
      <body>
        <div className="flex min-h-screen flex-col">
          <SiteHeader lang={lang} />
          {children}
          <SiteFooter lang={lang} />
        </div>
      </body>
    </html>
  );
}
