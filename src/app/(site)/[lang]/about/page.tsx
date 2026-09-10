import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAbout } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

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

  const about = await getAbout();

  return (
    <main className="gutter flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <div className="grid max-w-[1180px] items-start gap-[clamp(30px,5vw,74px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))]">
        {about.portraitKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(about.portraitKey, "full")}
            alt={about.lead[lang]}
            className="w-full"
          />
        ) : (
          <div className="slot w-full" style={{ aspectRatio: 0.84 }}>
            <span>{about.portraitSlot[lang]}</span>
          </div>
        )}

        <div className="max-w-[56ch]">
          <h1 className="mb-[26px] font-serif text-[clamp(25px,2.9vw,37px)] leading-[1.14] font-normal text-pretty">
            {about.lead[lang]}
          </h1>

          {about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="mb-[18px] text-[14.5px] leading-[1.78] text-ink-soft text-pretty last:mb-[34px]"
            >
              {paragraph[lang]}
            </p>
          ))}

          <div className="grid gap-[22px] border-t border-rule pt-[26px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))]">
            {about.facts.map((fact, index) => (
              <div key={index}>
                <div className="label mb-[9px]">{fact.label[lang]}</div>
                <div className="text-[12.5px] leading-[1.65] text-ink-soft">
                  {fact.a[lang]}
                </div>
                <div className="text-[12.5px] leading-[1.65] text-ink-soft">
                  {fact.b[lang]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
