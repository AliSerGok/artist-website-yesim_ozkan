import Link from "next/link";

import {
  deleteCvGroupRowAction,
  deleteCvRowAction,
  reorderCvAction,
  reorderCvGroupsAction,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DragHandle, SortableList } from "@/components/admin/sortable-list";
import { getAllCvEntries, getAllCvGroups } from "@/lib/content";
import type { CvEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<CvEntry["kind"], string> = {
  solo: "kişisel",
  group: "grup",
  "": "",
};

function Row({ entry }: { entry: CvEntry }) {
  const note = [KIND_LABEL[entry.kind], entry.published ? "" : "taslak"]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid items-center gap-4 border-b border-rule py-2.5 [grid-template-columns:auto_56px_minmax(0,1fr)_auto]">
      <DragHandle id={entry.id} />

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
        <Link href={`/admin/cv/${entry.id}`} className="adm-btn">
          Düzenle
        </Link>
        <ActionForm action={deleteCvRowAction}>
          <input type="hidden" name="id" value={entry.id} />
          <ConfirmButton
            message={`"${entry.title.tr}" silinsin mi? Bu geri alınamaz.`}
          >
            Sil
          </ConfirmButton>
        </ActionForm>
      </div>
    </div>
  );
}

/** One heading's lines, dragged among themselves and nowhere else. */
function Lines({ entries }: { entries: CvEntry[] }) {
  return (
    <SortableList
      action={reorderCvAction}
      rows={entries.map((entry) => ({
        id: entry.id,
        content: <Row entry={entry} />,
      }))}
    />
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
        satırlar da kendi başlığı içinde sürüklenir; tutamaç her satırın
        solunda. Boş başlık ve gizlenen başlık sitede görünmez.
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

          <Lines entries={unfiled} />
        </section>
      )}

      <SortableList
        className="mt-9 flex flex-col gap-9"
        action={reorderCvGroupsAction}
        rows={groups.map((group) => {
          const rows = entries
            .filter((entry) => entry.groupId === group.id)
            .sort(byOrder);

          return {
            id: group.id,
            content: (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <DragHandle
                      id={group.id}
                      label="Başlığı sürükleyerek taşı"
                    />
                    <h2 className="font-serif text-[19px] leading-none">
                      {group.title.tr}
                      {!group.published && (
                        <span className="adm-note ml-2.5">gizli</span>
                      )}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/cv/groups/${group.id}`}
                      className="adm-btn"
                    >
                      Başlığı düzenle
                    </Link>
                    <Link
                      href={`/admin/cv/new?group=${group.id}`}
                      className="adm-btn"
                    >
                      Satır ekle
                    </Link>
                    <ActionForm action={deleteCvGroupRowAction}>
                      <input type="hidden" name="id" value={group.id} />
                      <ConfirmButton
                        message={
                          rows.length > 0
                            ? `"${group.title.tr}" başlığı silinsin mi? Altındaki ${rows.length} satır silinmez, başlıksız olarak listenin üstüne taşınır.`
                            : `"${group.title.tr}" başlığı silinsin mi? Bu geri alınamaz.`
                        }
                      >
                        Başlığı sil
                      </ConfirmButton>
                    </ActionForm>
                  </div>
                </div>

                <Lines entries={rows} />

                {rows.length === 0 && (
                  <p className="adm-note py-3">
                    Bu başlıkta henüz satır yok; boş kaldığı sürece sitede
                    görünmez.
                  </p>
                )}
              </section>
            ),
          };
        })}
      />

      {groups.length === 0 && unfiled.length === 0 && (
        <p className="adm-note mt-6">Henüz katılım eklenmemiş.</p>
      )}
    </>
  );
}
