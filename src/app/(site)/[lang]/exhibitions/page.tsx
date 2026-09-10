import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getExhibitions } from "@/lib/content";
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
    title: dict(lang).exhibitionsTitle,
    alternates: {
      canonical: `/${lang}/exhibitions`,
      languages: { tr: "/tr/exhibitions", en: "/en/exhibitions" },
    },
  };
}

export default async function ExhibitionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = dict(lang);
  const exhibitions = await getExhibitions();

  return (
    <main className="gutter max-w-[1180px] flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <h1 className="page-title mb-[clamp(30px,4.5vw,58px)]">
        {t.exhibitionsTitle}
      </h1>

      {exhibitions.map((exhibition) => (
        <div
          key={exhibition.id}
          className="grid items-baseline gap-x-[26px] gap-y-[6px] border-t border-rule py-[18px] md:grid-cols-[64px_minmax(0,1.5fr)_minmax(0,1fr)]"
        >
          <div className="text-[12px] tracking-[0.1em] text-mute-2">
            {exhibition.year}
          </div>
          <div className="font-serif text-[clamp(18px,2vw,24px)] leading-[1.25]">
            {exhibition.title[lang]}
          </div>
          <div className="text-[12.5px] leading-[1.55] text-mute">
            {exhibition.venue[lang]}
            <span className="label mt-[3px] block">
              {exhibition.kind[lang]}
            </span>
          </div>
        </div>
      ))}

      <div className="border-t border-rule" />
    </main>
  );
}
