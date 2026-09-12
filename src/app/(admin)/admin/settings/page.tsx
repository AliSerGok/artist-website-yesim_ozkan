import { saveSettingsAction } from "@/app/(admin)/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getSettings } from "@/lib/content";
import type { SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

const ANIMATIONS: {
  name: keyof SiteSettings;
  title: string;
  detail: string;
}[] = [
  {
    name: "dancer",
    title: "Dansçı",
    detail:
      "Görsellerin üstüne tüneyip dans eden küçük figür. İmleci takip eder; dokunmatik ekranlarda zaten görünmez.",
  },
  {
    name: "birds",
    title: "Kuşlar",
    detail:
      "Üst bardaki menü bağlantılarına konan dört kuş. Zıplar, gerinir, imleç yaklaşınca uçarlar. Dar ekranda ikisi görünür.",
  },
];

export default async function EditSettings() {
  const settings = await getSettings();

  return (
    <>
      <h1 className="adm-h1">Animasyonlar</h1>
      <p className="adm-note mt-3 max-w-[60ch]">
        Sitedeki süslemeleri buradan tek tek kapatabilirsin. Kapattığın
        animasyonun kodu ziyaretçiye hiç gönderilmez. Ziyaretçinin cihazında
        “hareketi azalt” ayarı açıksa ikisi de kendiliğinden devre dışı kalır.
      </p>

      <form action={saveSettingsAction} className="mt-8 flex flex-col gap-4">
        {ANIMATIONS.map((animation) => (
          <label
            key={animation.name}
            className="adm-card flex cursor-pointer items-start gap-4"
          >
            <input
              type="checkbox"
              name={animation.name}
              defaultChecked={settings[animation.name]}
              className="mt-1 h-4 w-4 accent-[#14140f]"
            />
            <span>
              <span className="block font-serif text-[19px] leading-tight">
                {animation.title}
              </span>
              <span className="adm-note mt-1.5 block max-w-[62ch]">
                {animation.detail}
              </span>
            </span>
          </label>
        ))}

        <div>
          <SubmitButton
            className="adm-btn adm-btn-primary"
            busyLabel="Kaydediliyor…"
          >
            Kaydet
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
