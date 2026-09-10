"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { mediaUrl } from "@/lib/media";

const FULL_EDGE = 2400;
const GRID_EDGE = 900;

interface Resized {
  blob: Blob;
  width: number;
  height: number;
}

/** Downscales and re-encodes in the browser, so R2 only ever stores web-sized files. */
async function resize(file: File, maxEdge: number): Promise<Resized> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tarayıcı görseli işleyemedi.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Görsel dönüştürülemedi.");

  return { blob, width, height };
}

export function ImageUploader({
  workId,
  imageKey,
}: {
  workId: string;
  imageKey: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(imageKey);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const [full, grid] = await Promise.all([
        resize(file, FULL_EDGE),
        resize(file, GRID_EDGE),
      ]);

      const body = new FormData();
      body.append("workId", workId);
      body.append("full", full.blob, "full.webp");
      body.append("grid", grid.blob, "grid.webp");
      body.append("width", String(full.width));
      body.append("height", String(full.height));

      const response = await fetch("/admin/api/upload", {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(await response.text());

      const result = (await response.json()) as { key: string };
      setCurrent(result.key);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm("Görsel silinsin mi?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/upload", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workId }),
      });
      if (!response.ok) throw new Error(await response.text());
      setCurrent(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Silme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="adm-label">Görsel</span>

      {current ? (
        <div className="flex flex-wrap items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(current, "grid")}
            alt=""
            className="max-h-[220px] border border-rule"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="adm-btn"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Değiştir
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-danger"
              disabled={busy}
              onClick={remove}
            >
              Sil
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="adm-btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Yükleniyor…" : "Görsel yükle"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <p className="adm-note mt-2">
        JPEG veya PNG yükle; tarayıcı otomatik olarak web boyutuna küçültüp
        WebP’ye çevirir. En/boy oranı görselden alınır.
      </p>

      {busy && <p className="adm-note mt-2">Yükleniyor…</p>}
      {error && <p className="adm-note mt-2 text-[#a3312a]">{error}</p>}
    </div>
  );
}
