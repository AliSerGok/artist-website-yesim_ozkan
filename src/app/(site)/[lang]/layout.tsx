import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

import "../../globals.css";

/*
 * Başlıkların yüzü. Değişken ağırlıklı, ama opsz eksenini bilerek istemiyoruz:
 * Fraunces varsayılan optik boyutunda (14) metin kesimini veriyor — dolgun ve
 * düşük kontrastlı. opsz'yi açsaydık 44px'lik başlıklarda display kesimine
 * geçip yine incelirdi. WONK da 0'da kalıyor, yani sakin formlar.
 *
 * Yüzü değiştirmek isteyen buradaki iki çağrıyı değiştirsin yeter: globals.css
 * yüze adıyla değil --font-serif-face üzerinden bakıyor.
 */
const serif = Fraunces({
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif-face",
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
    // The canonical and hreflang values below are written relative; Google
    // ignores an hreflang that is not a fully qualified URL, so they have to
    // be resolved against the site origin before they reach the head.
    metadataBase: new URL(SITE_URL),
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
