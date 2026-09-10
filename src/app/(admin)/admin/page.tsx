import Link from "next/link";

import { getAllSeries, getAllWorks, getExhibitions } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [works, series, exhibitions] = await Promise.all([
    getAllWorks(),
    getAllSeries(),
    getExhibitions(),
  ]);

  const published = works.filter((work) => work.published).length;
  const inSeries = works.filter((work) => work.seriesId !== null).length;

  const cards = [
    {
      href: "/admin/works",
      title: "İşler",
      detail: `${published} yayında · ${works.length - published} taslak`,
    },
    {
      href: "/admin/series",
      title: "Seriler",
      detail: `${series.length} seri · ${inSeries} iş bir seride`,
    },
    {
      href: "/admin/exhibitions",
      title: "Sergiler",
      detail: `${exhibitions.length} kayıt`,
    },
    { href: "/admin/pages/about", title: "Hakkında", detail: "Metin ve künye" },
    {
      href: "/admin/pages/contact",
      title: "İletişim",
      detail: "Adresler ve notlar",
    },
  ];

  return (
    <>
      <h1 className="adm-h1">Merhaba Yeşim</h1>
      <p className="adm-note mt-3 max-w-[52ch]">
        Buradaki her değişiklik kaydedildiği anda siteye yansır. İki dili de
        doldurmak zorunda değilsin — İngilizce boş bırakılırsa Türkçe metin
        kullanılır.
      </p>

      <div className="mt-9 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="adm-card block">
            <div className="font-serif text-[21px] leading-tight">
              {card.title}
            </div>
            <div className="adm-note mt-2">{card.detail}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
