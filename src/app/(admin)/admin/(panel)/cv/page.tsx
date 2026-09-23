import Link from "next/link";

import {
  moveCvAction,
  moveCvGroupAction,
} from "@/app/(admin)/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAllCvEntries, getAllCvGroups } from "@/lib/content";
import type { CvEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

function MoveButtons({
  action,
  id,
  first,
  last,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  first: boolean;
  last: boolean;
}) {
  return (
    <>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <SubmitButton
          className="adm-btn px-2.5"
          disabled={first}
          aria-label="Yukarı taşı"
        >
          ↑
        </SubmitButton>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <SubmitButton
          className="adm-btn px-2.5"
          disabled={last}
          aria-label="Aşağı taşı"
        >
          ↓
        </SubmitButton>
      </form>
    </>
  );
}

const KIND_LABEL: Record<CvEntry["kind"], string> = {
  solo: "kişisel",
  group: "grup",
  "": "",
};

function Row({
  entry,
  first,
  last,
}: {
  entry: CvEntry;
  first: boolean;
  last: boolean;
}) {
  const note = [KIND_LABEL[entry.kind], entry.published ? "" : "taslak"]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid items-center gap-4 border-b border-rule py-2.5 [grid-template-columns:56px_minmax(0,1fr)_auto]">
      <div className="font-mono text-[11px] tracking-[0.12em] text-mute-3">
        {entry.year}
      </div>

      <div className="min-w-0">
        <Link
          href={`/admin/cv/${entry.id}`}
          className="text-[14px] hover:text-mute"
        >
          {entry.title.tr}
        </Link>
        {note && <div className="adm-note mt-0.5">{note}</div>}
      </div>

      <div className="flex items-center gap-1.5">
        <MoveButtons
          action={moveCvAction}
          id={entry.id}
          first={first}
          last={last}
        />
        <Link href={`/admin/cv/${entry.id}`} className="adm-btn">
          Düzenle
        </Link>
      </div>
    </div>
  );
}

export default async function AdminCv() {
  const [groups, entries] = await Promise.all([
    getAllCvGroups(),
    getAllCvEntries(),
  ]);

  const byOrder = (a: CvEntry, b: CvEntry) => a.order - b.order;
  const known = new Set(groups.map((group) => group.id));

  // Lines written before the artist made any heading, plus anything whose
  // heading has since been deleted.
  const unfiled = entries
    .filter((entry) => entry.groupId === null || !known.has(entry.groupId))
    .sort(byOrder);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="adm-h1">Katılımlar</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/cv/groups/new" className="adm-btn">
            Yeni başlık
          </Link>
          <Link href="/admin/cv/new" className="adm-btn adm-btn-primary">
            Yeni satır
          </Link>
        </div>
      </div>

      <p className="adm-note mt-3 max-w-[62ch]">
        Hakkında sayfasının altındaki tam liste. İstediğin kadar başlık
        açabilirsin — Sergiler, Yarışmalar, Ödüller… Başlıklar kendi aralarında,
        satırlar da kendi başlığı içinde taşınır. Boş başlık ve gizlenen başlık
        sitede görünmez.
      </p>

      {unfiled.length > 0 && (
        <section className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-2">
            <h2 className="font-serif text-[19px] leading-none text-mute">
              Başlıksız
            </h2>
            <span className="adm-note">
              Bu satırlar listenin en üstünde, başlıksız görünür.
            </span>
          </div>

          {unfiled.map((entry, index) => (
            <Row
              key={entry.id}
              entry={entry}
              first={index === 0}
              last={index === unfiled.length - 1}
            />
          ))}
        </section>
      )}

      {groups.map((group, groupIndex) => {
        const rows = entries
          .filter((entry) => entry.groupId === group.id)
          .sort(byOrder);

        return (
          <section key={group.id} className="mt-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-2">
              <h2 className="font-serif text-[19px] leading-none">
                {group.title.tr}
                {!group.published && (
                  <span className="adm-note ml-2.5">gizli</span>
                )}
              </h2>

              <div className="flex items-center gap-1.5">
                <MoveButtons
                  action={moveCvGroupAction}
                  id={group.id}
                  first={groupIndex === 0}
                  last={groupIndex === groups.length - 1}
                />
                <Link href={`/admin/cv/groups/${group.id}`} className="adm-btn">
                  Başlığı düzenle
                </Link>
                <Link href={`/admin/cv/new?group=${group.id}`} className="adm-btn">
                  Satır ekle
                </Link>
              </div>
            </div>

            {rows.map((entry, index) => (
              <Row
                key={entry.id}
                entry={entry}
                first={index === 0}
                last={index === rows.length - 1}
              />
            ))}

            {rows.length === 0 && (
              <p className="adm-note py-3">
                Bu başlıkta henüz satır yok; boş kaldığı sürece sitede
                görünmez.
              </p>
            )}
          </section>
        );
      })}

      {groups.length === 0 && unfiled.length === 0 && (
        <p className="adm-note mt-6">Henüz katılım eklenmemiş.</p>
      )}
    </>
  );
}
