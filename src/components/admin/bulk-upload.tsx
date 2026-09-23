"use client";

import { useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/admin/submit-button";
import { useToast } from "@/components/admin/toast";
import type { Note } from "@/lib/flash";
import { titleFromFile, uploadImage } from "@/lib/image-upload";

/** How many pictures one drop may carry. */
const MAX_AT_ONCE = 40;

type Stage = "waiting" | "busy" | "done" | "failed";

interface Queued {
  id: number;
  file: File;
  /** Local preview, so the queue is legible before anything is stored. */
  url: string;
  title: string;
  stage: Stage;
  key: string;
  width: number;
  height: number;
  error: string;
}

const SAID: Record<Stage, string> = {
  waiting: "sırada",
  busy: "yükleniyor…",
  done: "hazır",
  failed: "olmadı",
};

/**
 * A whole shoot at once. The pictures are stored as they are picked — one
 * after another, so a slow line never has twenty uploads fighting over it —
 * and the form that follows turns each into a work of the series.
 *
 * Nothing is written to the series until it is submitted, and each work is
 * an ordinary work afterwards: opened, retitled, cropped and reordered like
 * any other.
 */
export function BulkUpload({
  seriesId,
  action,
}: {
  seriesId: string;
  action: (form: FormData) => Promise<Note>;
}) {
  const push = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Queued[]>([]);
  const [over, setOver] = useState(false);

  /** The queue as the upload loop sees it; the state above is for the render. */
  const queue = useRef<Queued[]>([]);
  const running = useRef(false);
  const nextId = useRef(0);

  function write(next: Queued[]) {
    queue.current = next;
    setItems(next);
  }

  function patch(id: number, fields: Partial<Queued>) {
    write(
      queue.current.map((item) =>
        item.id === id ? { ...item, ...fields } : item,
      ),
    );
  }

  useEffect(() => {
    return () => {
      for (const item of queue.current) URL.revokeObjectURL(item.url);
    };
  }, []);

  /** Works through whatever is waiting, and keeps going if more arrives. */
  async function run() {
    if (running.current) return;
    running.current = true;

    try {
      for (;;) {
        const next = queue.current.find((item) => item.stage === "waiting");
        if (!next) return;

        patch(next.id, { stage: "busy" });
        try {
          // Uncropped: the whole picture is kept, and each work is cropped
          // afterwards on its own page, where it can be seen properly.
          const stored = await uploadImage("works/new", next.file, null);
          patch(next.id, { stage: "done", ...stored });
        } catch (cause) {
          patch(next.id, {
            stage: "failed",
            error: cause instanceof Error ? cause.message : "bilinmeyen hata",
          });
        }
      }
    } finally {
      running.current = false;
    }
  }

  function add(files: File[]) {
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (pictures.length === 0) return;

    const room = MAX_AT_ONCE - queue.current.length;
    if (room <= 0) {
      push(`Bir seferde en fazla ${MAX_AT_ONCE} görsel.`, "err");
      return;
    }
    if (pictures.length > room) {
      push(`İlk ${room} görsel alındı; gerisini ekledikten sonra sürükle.`, "err");
    }

    write([
      ...queue.current,
      ...pictures.slice(0, room).map((file) => {
        nextId.current += 1;
        return {
          id: nextId.current,
          file,
          url: URL.createObjectURL(file),
          title: titleFromFile(file.name),
          stage: "waiting" as Stage,
          key: "",
          width: 0,
          height: 0,
          error: "",
        };
      }),
    ]);

    void run();
  }

  function drop(id: number) {
    const going = queue.current.find((item) => item.id === id);
    if (going) URL.revokeObjectURL(going.url);
    write(queue.current.filter((item) => item.id !== id));
  }

  function clear() {
    for (const item of queue.current) URL.revokeObjectURL(item.url);
    write([]);
  }

  const ready = items.filter((item) => item.stage === "done").length;
  const busy = items.some((item) => item.stage !== "done" && item.stage !== "failed");

  return (
    <form
      action={async (data) => {
        const { note, tone } = await action(data);
        push(note, tone);
        // The works are the panel's now; the queue has nothing left to hold.
        if (tone === "ok") clear();
      }}
    >
      <input type="hidden" name="seriesId" value={seriesId} />

      <div
        className="border border-dashed border-rule-2 px-4 py-5 text-center"
        data-over={over ? "true" : undefined}
        style={over ? { borderColor: "var(--color-ink)" } : undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          add(Array.from(event.dataTransfer.files));
        }}
      >
        <button
          type="button"
          className="adm-btn"
          onClick={() => inputRef.current?.click()}
        >
          Görselleri seç
        </button>
        <p className="adm-note mt-2">
          Birden fazla seçebilir ya da buraya sürükleyebilirsin. Her görsel bu
          serinin bir işi olur; başlıkları şimdi yazabilir, kırpma ve diğer
          bilgileri sonra her işin kendi sayfasında düzenleyebilirsin.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          add(files);
        }}
      />

      {items.length > 0 && (
        <>
          <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 border border-rule p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="h-24 w-full bg-panel object-contain"
                  style={{ opacity: item.stage === "done" ? 1 : 0.55 }}
                />

                <input
                  className="adm-input"
                  // Named only once it is stored, so the titles and the keys
                  // reaching the action stay in step.
                  name={item.stage === "done" ? "title" : undefined}
                  value={item.title}
                  placeholder="Başlıksız"
                  aria-label="Başlık"
                  onChange={(event) =>
                    patch(item.id, { title: event.target.value })
                  }
                />

                {item.stage === "done" && (
                  <>
                    <input type="hidden" name="key" value={item.key} />
                    <input type="hidden" name="width" value={item.width} />
                    <input type="hidden" name="height" value={item.height} />
                  </>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="mono-note truncate" title={item.error}>
                    {item.stage === "failed" ? item.error : SAID[item.stage]}
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer px-1 text-[13px] text-mute-3 hover:text-ink"
                    aria-label="Listeden çıkar"
                    onClick={() => drop(item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SubmitButton
              className="adm-btn adm-btn-primary"
              busyLabel="Ekleniyor…"
              disabled={ready === 0 || busy}
            >
              {busy ? "Yükleniyor…" : `Seriye ekle (${ready})`}
            </SubmitButton>
            <button type="button" className="adm-btn" onClick={clear}>
              Listeyi boşalt
            </button>
          </div>
        </>
      )}
    </form>
  );
}
