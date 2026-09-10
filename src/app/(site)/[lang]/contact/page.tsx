import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getContact } from "@/lib/content";
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
    title: dict(lang).nav.contact,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: { tr: "/tr/contact", en: "/en/contact" },
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const contact = await getContact();

  return (
    <main className="gutter flex-1 animate-fade-up pt-[clamp(36px,6vw,86px)] pb-[110px]">
      <div className="grid max-w-[1080px] items-start gap-[clamp(30px,5vw,74px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
        <div>
          <h1 className="mb-[24px] font-serif text-[clamp(25px,2.9vw,37px)] leading-[1.14] font-normal text-pretty">
            {contact.lead[lang]}
          </h1>
          <p className="max-w-[44ch] text-[14.5px] leading-[1.78] text-ink-soft text-pretty">
            {contact.note[lang]}
          </p>
        </div>

        <div className="flex flex-col">
          {contact.rows.map((row, index) => (
            <div
              key={index}
              className="flex items-baseline justify-between gap-5 border-t border-rule py-[16px]"
            >
              <span className="label">{row.label[lang]}</span>
              <a
                href={row.href}
                className="font-serif text-[19px] leading-[1.2] text-right transition-colors duration-200 hover:text-mute"
              >
                {row.value}
              </a>
            </div>
          ))}
          <div className="border-t border-rule" />
        </div>
      </div>
    </main>
  );
}
