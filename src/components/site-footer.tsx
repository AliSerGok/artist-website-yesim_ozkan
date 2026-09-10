import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = dict(lang);

  return (
    <footer className="gutter flex flex-wrap justify-between gap-[18px] border-t border-rule pt-[22px] pb-[30px]">
      <span className="label">{t.footerLeft}</span>
      <span className="label">{t.footerRight}</span>
    </footer>
  );
}
