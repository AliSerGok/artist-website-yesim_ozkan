"use client";

import { useEffect, useRef, useState } from "react";

import { CropDialog } from "@/components/admin/crop-dialog";
import { useToast } from "@/components/admin/toast";
import { type CropArea, uploadImage } from "@/lib/image-upload";
import { mediaUrl } from "@/lib/media";

/**
 * An image slot inside a form. Picking a file opens the crop step; uploading
 * stores the result straight away and puts its key in a hidden input. The
 * record only points at it once the form is saved, and the old image is
 * cleaned up then.
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
  cropRatio,
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
  /** Ratio the site itself crops this slot to, offered in the crop step. */
  cropRatio?: number;
  disabled?: boolean;
  previewHeight?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [current, setCurrent] = useState(imageKey);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ blob: Blob; url: string } | null>(
    null,
  );

  /*
   * An uploaded key and its measured size are written here by React, not
   * typed, so the browser raises nothing for the surrounding form to hear.
   * Say it out loud the way a control set from script is meant to — the save
   * button is listening, and so is anything else that watches this form.
   */
  useEffect(() => {
    keyRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [current, size.width, size.height]);

  /**
   * The picture the crop works from. Keeping the file the admin chose means a
   * second crop starts from the original again, rather than from the already
   * downscaled copy in R2.
   */
  const sourceRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.url);
    };
  }, [pending]);

  function openCrop(blob: Blob) {
    setPending({ blob, url: URL.createObjectURL(blob) });
  }

  function closeCrop() {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
  }

  async function upload(blob: Blob, area: CropArea | null) {
    setBusy(true);
    try {
      const stored = await uploadImage(prefix, blob, area);
      setCurrent(stored.key);
      setSize({ width: stored.width, height: stored.height });
      toast("Görsel yüklendi — Kaydet’e basınca yerine geçer.");
    } catch (cause) {
      toast(
        cause instanceof Error
          ? `Görsel yüklenemedi — ${cause.message}`
          : "Görsel yüklenemedi.",
        "err",
      );
    } finally {
      setBusy(false);
    }
  }

  /** Crops what is already in the slot, uploading the result as a new image. */
  async function recrop() {
    if (!current) return;
    if (sourceRef.current) {
      openCrop(sourceRef.current);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(mediaUrl(current, "full"));
      if (!response.ok) throw new Error("Görsel okunamadı.");
      openCrop(await response.blob());
    } catch (cause) {
      toast(
        cause instanceof Error
          ? `Görsel açılamadı — ${cause.message}`
          : "Görsel açılamadı.",
        "err",
      );
    } finally {
      setBusy(false);
    }
  }

  const shownRatio = size.width
    ? Number((size.width / size.height).toFixed(3))
    : (ratio ?? 1);

  return (
    <div>
      <span className="adm-label">{label}</span>

      <input ref={keyRef} type="hidden" name={name} value={current ?? ""} />
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
            // The browser has the old crop under this key cached for a year;
            // a new upload has a new key, so the preview always follows.
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
            <>
              <button
                type="button"
                className="adm-btn"
                disabled={busy || disabled}
                onClick={() => void recrop()}
              >
                Kırp
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger"
                disabled={busy || disabled}
                onClick={() => {
                  sourceRef.current = null;
                  setCurrent(null);
                  setSize({ width: 0, height: 0 });
                  toast("Görsel kaldırıldı — Kaydet’e basınca silinir.");
                }}
              >
                Kaldır
              </button>
            </>
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
          // Cleared straight away: a crop that is called off has to leave the
          // same file pickable again, and the File itself is already in hand.
          event.target.value = "";
          if (!file) return;
          sourceRef.current = file;
          openCrop(file);
        }}
      />

      <p className="adm-note mt-2">
        {hint ??
          "JPEG veya PNG yükle; yüklemeden önce kırpabilirsin, tarayıcı web boyutuna küçültüp WebP’ye çevirir."}{" "}
        Değişiklik <strong>Kaydet</strong>’e bastığında geçerli olur.
      </p>

      {pending && (
        <CropDialog
          src={pending.url}
          suggested={cropRatio}
          onCancel={closeCrop}
          onConfirm={(area) => {
            const blob = pending.blob;
            closeCrop();
            void upload(blob, area);
          }}
        />
      )}
    </div>
  );
}
