import { notFound } from "next/navigation";

import { HomeSlideshow } from "@/components/home-slideshow";
import { toHomeSlide } from "@/lib/cards";
import { getHomeScreens } from "@/lib/content";
import { dict } from "@/lib/dictionary";
import { isLang } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const screens = await getHomeScreens();

  return (
    <main className="relative z-1 flex min-h-0 flex-1 animate-fade-up flex-col">
      {screens.length > 0 ? (
        <HomeSlideshow
          lang={lang}
          screens={screens.map((screen) =>
            screen.map((entry) => toHomeSlide(entry, lang)),
          )}
        />
      ) : (
        <p className="gutter py-[clamp(30px,5vw,60px)] text-[13px] text-mute-2">
          {dict(lang).noWorks}
        </p>
      )}
    </main>
  );
}
