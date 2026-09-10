import { notFound } from "next/navigation";

import { WorkGallery } from "@/components/work-gallery";
import { toGallerySeries, toGalleryWork } from "@/lib/cards";
import { getSeriesList, getWorks } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";

export default async function WorksPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const [works, series] = await Promise.all([getWorks(), getSeriesList()]);
  const singles = works.filter((work) => work.seriesId === null);

  const seriesCards = series.map((item) =>
    toGallerySeries(
      item,
      works.filter((work) => work.seriesId === item.id),
      lang,
    ),
  );

  return (
    <main className="relative z-1 flex flex-1 animate-fade-up flex-col pt-[clamp(30px,5vw,60px)]">
      <div className="gutter flex flex-wrap items-end gap-6">
        <h1 className="page-title">{dict(lang).worksTitle}</h1>
      </div>

      <WorkGallery
        lang={lang}
        works={singles.map((work) => toGalleryWork(work, lang))}
        series={seriesCards}
        counterTotal={series.length + singles.length}
      />
    </main>
  );
}
