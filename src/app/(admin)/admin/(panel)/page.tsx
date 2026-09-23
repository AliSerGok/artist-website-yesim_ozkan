import Link from "next/link";

import {
  getAllCvEntries,
  getAllExhibitions,
  getAllSeries,
  getAllWorks,
  getHome,
} from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [works, series, exhibitions, cv, home] = await Promise.all([
    getAllWorks(),
    getAllSeries(),
    getAllExhibitions(),
    getAllCvEntries(),
    getHome(),
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
      detail: `${exhibitions.length} öne çıkan sergi`,
    },
    {
      href: "/admin/cv",
      title: "Katılımlar",
      detail: `${cv.length} satır · hakkında sayfasında`,
    },
    {
      href: "/admin/pages/home",
      title: "Ana sayfa",
      detail:
        home.items.length > 0
          ? `${home.items.length} slayt dönüyor`
          : "Seçilmedi · ilk işler dönüyor",
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
