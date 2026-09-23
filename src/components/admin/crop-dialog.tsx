"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { CropArea } from "@/lib/image-upload";

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** The image as it is laid out on screen, measured against the stage. */
interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Smallest crop the pointer is allowed to make, in screen pixels. */
const MIN_ON_SCREEN = 32;

/** Corners resize both edges; the sides only move their own. */
const FREE_HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const LOCKED_HANDLES: Handle[] = ["nw", "ne", "se", "sw"];

const PRESETS: { label: string; ratio: number | null }[] = [
  { label: "Serbest", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:5", ratio: 4 / 5 },
  { label: "3:4", ratio: 3 / 4 },
  { label: "2:3", ratio: 2 / 3 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "16:9", ratio: 16 / 9 },
];

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/** Reshapes a crop to a ratio around its own centre, kept inside the image. */
function fitRatio(
  area: CropArea,
  ratio: number,
  natural: { width: number; height: number },
): CropArea {
  let width = area.width;
  let height = area.height;

  if (width / height > ratio) width = height * ratio;
  else height = width / ratio;

  if (width > natural.width) {
    width = natural.width;
    height = width / ratio;
  }
  if (height > natural.height) {
    height = natural.height;
    width = height * ratio;
  }

  return {
    width,
    height,
    x: clamp(area.x + area.width / 2 - width / 2, 0, natural.width - width),
    y: clamp(area.y + area.height / 2 - height / 2, 0, natural.height - height),
  };
}

/** Where a handle drag leaves the crop, in source pixels. */
function resized(
  origin: CropArea,
  handle: Handle,
  dx: number,
  dy: number,
  natural: { width: number; height: number },
  ratio: number | null,
  min: number,
): CropArea {
  if (ratio) {
    // A locked crop grows away from the corner opposite the one being
    // dragged, so that corner stays put however far the pointer travels.
    const anchorX = handle.includes("w") ? origin.x + origin.width : origin.x;
    const anchorY = handle.includes("n") ? origin.y + origin.height : origin.y;
    const toX = (handle.includes("w") ? origin.x : origin.x + origin.width) + dx;
    const toY =
      (handle.includes("n") ? origin.y : origin.y + origin.height) + dy;

    const maxWidth = handle.includes("w") ? anchorX : natural.width - anchorX;
    const maxHeight = handle.includes("n") ? anchorY : natural.height - anchorY;

    // The diagonal the pointer suggests, whichever axis it moved along most.
    let width = Math.max(Math.abs(toX - anchorX), Math.abs(toY - anchorY) * ratio);
    width = clamp(width, min, maxWidth);
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    return {
      width,
      height,
      x: handle.includes("w") ? anchorX - width : anchorX,
      y: handle.includes("n") ? anchorY - height : anchorY,
    };
  }

  let left = origin.x;
  let top = origin.y;
  let right = origin.x + origin.width;
  let bottom = origin.y + origin.height;

  if (handle.includes("w")) left = clamp(left + dx, 0, right - min);
  if (handle.includes("e")) right = clamp(right + dx, left + min, natural.width);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - min);
  if (handle.includes("s")) {
    bottom = clamp(bottom + dy, top + min, natural.height);
  }

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Rounds to whole pixels without letting the crop slip off the image. */
function whole(area: CropArea, natural: { width: number; height: number }) {
  const x = clamp(Math.round(area.x), 0, natural.width - 1);
  const y = clamp(Math.round(area.y), 0, natural.height - 1);
  return {
    x,
    y,
    width: clamp(Math.round(area.width), 1, natural.width - x),
    height: clamp(Math.round(area.height), 1, natural.height - y),
  };
}

/**
 * The crop step every upload passes through. It works on the picture the
 * admin picked — never on what is already stored — and hands back the chosen
 * rectangle in source pixels; components/admin/image-field.tsx draws it and
 * uploads the result. Confirming without touching anything returns `null`,
 * which is the same as not cropping at all.
 */
export function CropDialog({
  src,
  suggested,
  onCancel,
  onConfirm,
}: {
  src: string;
  /** Ratio the slot itself shows at, offered as the first preset. */
  suggested?: number;
  onCancel: () => void;
  onConfirm: (area: CropArea | null) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [natural, setNatural] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [area, setArea] = useState<CropArea | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const scale = frame && natural ? frame.width / natural.width : 1;

  /**
   * Keeps the overlay sitting exactly on the picture, at any window size.
   * The <img> covers the whole stage and `object-fit: contain` letterboxes
   * the picture inside it, so the painted rectangle is worked out here rather
   * than read off the element — the element's box is the stage, not the
   * picture.
   */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image || !image.naturalWidth) return;

    const stageBox = stage.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();

    // The picture is fitted inside the element's padding, which is the
    // margin that keeps the frame's handles clear of the stage's edges.
    const style = getComputedStyle(image);
    const left = Number.parseFloat(style.paddingLeft) || 0;
    const top = Number.parseFloat(style.paddingTop) || 0;
    const boxWidth =
      imageBox.width - left - (Number.parseFloat(style.paddingRight) || 0);
    const boxHeight =
      imageBox.height - top - (Number.parseFloat(style.paddingBottom) || 0);

    const fit = Math.min(
      boxWidth / image.naturalWidth,
      boxHeight / image.naturalHeight,
    );
    const width = image.naturalWidth * fit;
    const height = image.naturalHeight * fit;

    setFrame({
      left: imageBox.left - stageBox.left + left + (boxWidth - width) / 2,
      top: imageBox.top - stageBox.top + top + (boxHeight - height) / 2,
      width,
      height,
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function load() {
    const image = imageRef.current;
    if (!image) return;
    const size = { width: image.naturalWidth, height: image.naturalHeight };
    setNatural(size);
    setArea({ x: 0, y: 0, width: size.width, height: size.height });
    measure();
  }

  function choose(next: number | null) {
    setRatio(next);
    if (next && area && natural) setArea(fitRatio(area, next, natural));
  }

  function reset() {
    if (!natural) return;
    const full = { x: 0, y: 0, width: natural.width, height: natural.height };
    setArea(ratio ? fitRatio(full, ratio, natural) : full);
  }

  /** One gesture: the crop is moved, or one of its handles is pulled. */
  function drag(event: React.PointerEvent, handle: Handle | "move") {
    if (!area || !natural || !frame) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const origin = area;
    const perPixel = natural.width / frame.width;
    const min = Math.min(
      MIN_ON_SCREEN * perPixel,
      natural.width,
      natural.height,
    );

    const move = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) * perPixel;
      const dy = (moveEvent.clientY - startY) * perPixel;

      setArea(
        handle === "move"
          ? {
              ...origin,
              x: clamp(origin.x + dx, 0, natural.width - origin.width),
              y: clamp(origin.y + dy, 0, natural.height - origin.height),
            }
          : resized(origin, handle, dx, dy, natural, ratio, min),
      );
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function confirm() {
    if (!area || !natural) {
      onConfirm(null);
      return;
    }

    const cut = whole(area, natural);
    const untouched =
      cut.x === 0 &&
      cut.y === 0 &&
      cut.width === natural.width &&
      cut.height === natural.height;

    onConfirm(untouched ? null : cut);
  }

  const cut = area && natural ? whole(area, natural) : null;
  const handles = ratio ? LOCKED_HANDLES : FREE_HANDLES;
  const presets = suggested
    ? [
        {
          label: `Alan oranı ${suggested.toFixed(2).replace(/\.?0+$/, "")}`,
          ratio: suggested,
        },
        ...PRESETS,
      ]
    : PRESETS;

  return createPortal(
    <div className="adm-crop" role="dialog" aria-modal="true" aria-label="Görseli kırp">
      <div className="adm-crop-panel">
        <div className="adm-crop-head">
          <span className="adm-label mb-0">Görseli kırp</span>
          <span className="mono-note">
            {cut
              ? `${cut.width} × ${cut.height} px · ${(cut.width / cut.height)
                  .toFixed(2)
                  .replace(/\.?0+$/, "")}`
              : "yükleniyor…"}
          </span>
        </div>

        <div className="adm-crop-stage" ref={stageRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt=""
            draggable={false}
            className="adm-crop-image"
            onLoad={load}
            onError={() => setFailed(true)}
          />

          {area && frame && (
            <div
              className="adm-crop-rect"
              style={{
                left: frame.left + area.x * scale,
                top: frame.top + area.y * scale,
                width: area.width * scale,
                height: area.height * scale,
              }}
              onPointerDown={(event) => drag(event, "move")}
            >
              {handles.map((handle) => (
                <span
                  key={handle}
                  data-handle={handle}
                  className="adm-crop-handle"
                  onPointerDown={(event) => drag(event, handle)}
                />
              ))}
            </div>
          )}

          {failed && (
            <p className="adm-error absolute">Görsel açılamadı.</p>
          )}
        </div>

        <div className="adm-crop-ratios">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="adm-chip"
              data-on={
                preset.ratio === null
                  ? ratio === null
                  : ratio !== null && Math.abs(ratio - preset.ratio) < 0.005
              }
              onClick={() => choose(preset.ratio)}
            >
              {preset.label}
            </button>
          ))}
          <button type="button" className="adm-chip" onClick={reset}>
            Tümü
          </button>
        </div>

        <div className="adm-crop-foot">
          <p className="adm-note">
            Çerçeveyi sürükleyerek taşı, köşelerinden tutup boyutlandır. Kırpma
            yalnızca yüklenecek kopyaya uygulanır.
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="adm-btn" onClick={onCancel}>
              Vazgeç
            </button>
            <button
              type="button"
              className="adm-btn"
              disabled={!natural}
              onClick={() => onConfirm(null)}
            >
              Kırpmadan yükle
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              disabled={!natural}
              onClick={confirm}
            >
              Kırp ve yükle
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
