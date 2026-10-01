import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutFlow, AboutHead, visibleBlocks } from "@/components/about-flow";
import { getAbout, getCvSections } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: dict(lang).nav.about,
    alternates: {
      canonical: `/${lang}/about`,
      languages: { tr: "/tr/about", en: "/en/about" },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const [about, cv] = await Promise.all([getAbout(), getCvSections()]);

  return (
    <main className="gutter relative z-1 flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <AboutHead about={about} lang={lang} />
      <AboutFlow blocks={visibleBlocks(about.blocks, cv)} lang={lang} cv={cv} />
    </main>
  );
}
