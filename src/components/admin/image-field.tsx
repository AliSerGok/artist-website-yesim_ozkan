"use client";

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

/**
 * An image slot inside a form. Uploading stores the file straight away and
 * puts its key in a hidden input; the record only points at it once the form
 * is saved, and the old image is cleaned up then.
 */
export function ImageField({
  name,
  prefix,
  imageKey,
  label = "Görsel",
  hint,
  widthName,
  heightName,
  ratioName,
  ratio,
  disabled = false,
  previewHeight = 200,
}: {
  name: string;
  prefix: string;
  imageKey: string | null;
  label?: string;
  hint?: string;
  /** Hidden inputs to receive the intrinsic size, when the record stores it. */
  widthName?: string;
  heightName?: string;
  /** Or a single width/height ratio, for the about-page blocks. */
  ratioName?: string;
  ratio?: number;
  disabled?: boolean;
  previewHeight?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(imageKey);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const [full, grid] = await Promise.all([
        resize(file, FULL_EDGE),
        resize(file, GRID_EDGE),
      ]);

      const body = new FormData();
      body.append("prefix", prefix);
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
      setSize({ width: full.width, height: full.height });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shownRatio = size.width
    ? Number((size.width / size.height).toFixed(3))
    : (ratio ?? 1);

  return (
    <div>
      <span className="adm-label">{label}</span>

      <input type="hidden" name={name} value={current ?? ""} />
      {widthName && (
        <input type="hidden" name={widthName} value={size.width || ""} />
      )}
      {heightName && (
        <input type="hidden" name={heightName} value={size.height || ""} />
      )}
      {ratioName && (
        <input type="hidden" name={ratioName} value={shownRatio} />
      )}

      <div className="flex flex-wrap items-start gap-4">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(current, "grid")}
            alt=""
            className="border border-rule object-contain"
            style={{ maxHeight: previewHeight }}
          />
        ) : (
          <div
            className="slot"
            style={{ height: previewHeight, aspectRatio: shownRatio }}
          />
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="adm-btn"
            disabled={busy || disabled}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Yükleniyor…" : current ? "Değiştir" : "Görsel yükle"}
          </button>
          {current && (
            <button
              type="button"
              className="adm-btn adm-btn-danger"
              disabled={busy || disabled}
              onClick={() => {
                setCurrent(null);
                setSize({ width: 0, height: 0 });
              }}
            >
              Kaldır
            </button>
          )}
        </div>
      </div>

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
        {hint ??
          "JPEG veya PNG yükle; tarayıcı web boyutuna küçültüp WebP’ye çevirir."}{" "}
        Değişiklik <strong>Kaydet</strong>’e bastığında geçerli olur.
      </p>

      {error && <p className="adm-note mt-2 text-[#a3312a]">{error}</p>}
    </div>
  );
}
