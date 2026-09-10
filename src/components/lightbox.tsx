"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export interface ViewerWork {
  id: string;
  slug: string;
  title: string;
  year: string;
  caption: string;
  note: string;
  slot: string;
  ratio: number;
  imageKey: string | null;
}

const ZOOM = 2.2;
const BAR_OPEN = 132;
const BAR_CLOSED = 62;

export function Lightbox({
  lang,
  works,
  index,
  onStep,
  onClose,
}: {
  lang: Lang;
  works: ViewerWork[];
  index: number;
  onStep: (nextIndex: number) => void;
  onClose: () => void;
}) {
  const t = dict(lang);
  const work = works[index];

  const [noteOpen, setNoteOpen] = useState(true);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [noteClipped, setNoteClipped] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [barHeight, setBarHeight] = useState(BAR_OPEN);

  const imageRef = useRef<HTMLImageElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);

  const hasNote = work.note.trim().length > 0;
  const hasImage = work.imageKey !== null;
  const noteShown = noteOpen && hasNote;

  /* ------------------------------------------------------------- zoom */

  const applyTransform = useCallback((animate: boolean, on: boolean) => {
    const element = imageRef.current;
    if (!element) return;
    element.style.transition = animate
      ? "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)"
      : "none";
    element.style.transform = on
      ? `scale(${ZOOM}) translate(${pan.current.x}px, ${pan.current.y}px)`
      : "scale(1)";
  }, []);

  /** Keeps the zoomed image from being dragged past its own edges. */
  const clampPan = useCallback(() => {
    const element = imageRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const max = (size: number) => (size / ZOOM) * ((ZOOM - 1) / (2 * ZOOM));
    const maxX = max(rect.width);
    const maxY = max(rect.height);
    pan.current = {
      x: Math.max(-maxX, Math.min(maxX, pan.current.x)),
      y: Math.max(-maxY, Math.min(maxY, pan.current.y)),
    };
  }, []);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      pan.current = {
        x: pan.current.x + dx / ZOOM,
        y: pan.current.y + dy / ZOOM,
      };
      clampPan();
      applyTransform(false, true);
    },
    [applyTransform, clampPan],
  );

  const resetZoom = useCallback(() => {
    pan.current = { x: 0, y: 0 };
    setZoomed(false);
    applyTransform(false, false);
  }, [applyTransform]);

  function toggleZoom(event: React.MouseEvent<HTMLImageElement>) {
    event.stopPropagation();
    if (!hasImage) return;
    if (dragged.current) {
      dragged.current = false;
      return;
    }

    const element = imageRef.current;
    if (!zoomed && element) {
      // Zoom towards the point that was clicked.
      const rect = element.getBoundingClientRect();
      pan.current = {
        x: -(event.clientX - (rect.left + rect.width / 2)),
        y: -(event.clientY - (rect.top + rect.height / 2)),
      };
    } else {
      pan.current = { x: 0, y: 0 };
    }

    const next = !zoomed;
    setZoomed(next);
    if (next) clampPan();
    applyTransform(true, next);
  }

  function startPan(event: React.MouseEvent) {
    if (!zoomed) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...pan.current };
    dragged.current = false;
    setDragging(true);

    const move = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragged.current = true;
      pan.current = { x: origin.x + dx / ZOOM, y: origin.y + dy / ZOOM };
      clampPan();
      applyTransform(false, true);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      setDragging(false);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  const touchStart = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);

  function startTouchPan(event: React.TouchEvent) {
    if (!zoomed) return;
    const touch = event.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      px: pan.current.x,
      py: pan.current.y,
    };
  }

  function moveTouchPan(event: React.TouchEvent) {
    const start = touchStart.current;
    if (!zoomed || !start) return;
    const touch = event.touches[0];
    pan.current = {
      x: start.px + (touch.clientX - start.x) / ZOOM,
      y: start.py + (touch.clientY - start.y) / ZOOM,
    };
    clampPan();
    applyTransform(false, true);
  }

  /* ------------------------------------------------------- navigation */

  const step = useCallback(
    (direction: number) => {
      const next = (index + direction + works.length) % works.length;
      setNoteExpanded(false);
      setNoteOpen(true);
      resetZoom();
      onStep(next);
    },
    [index, works.length, onStep, resetZoom],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (zoomed) resetZoom();
        else if (noteExpanded) setNoteExpanded(false);
        else onClose();
      }
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "i" || event.key === "I") {
        setNoteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, noteExpanded, onClose, resetZoom, step]);

  /** Two-finger scroll pans the zoomed image instead of the page. */
  useEffect(() => {
    const element = imageRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      if (!zoomed) return;
      event.preventDefault();
      panBy(-event.deltaX, -event.deltaY);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [zoomed, panBy]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /** The expanded note sits directly on top of the bar, whatever its height. */
  useEffect(() => {
    const element = barRef.current;
    if (!element) return;
    const measure = () =>
      setBarHeight(Math.round(element.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** "Read more" only appears when the text is really cut off. */
  useEffect(() => {
    const measure = () => {
      const element = noteRef.current;
      setNoteClipped(
        !!element && element.scrollHeight - element.clientHeight > 1,
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index, noteShown, work.note]);

  /* ------------------------------------------------------------ render */

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(
    works.length,
  ).padStart(2, "0")}`;

  const zoomCursor = !hasImage
    ? "default"
    : zoomed
      ? dragging
        ? "grabbing"
        : "grab"
      : "zoom-in";

  // Rendered on <body>: the page's fadeUp animation leaves an identity
  // transform on <main>, which would otherwise anchor this fixed overlay
  // to <main> instead of the viewport.
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-90 flex animate-fade-up cursor-zoom-out flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label={work.title}
    >
      <div
        className="lb-img"
        style={{ paddingBottom: noteShown ? 150 : 80 }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={mediaUrl(work.imageKey!, "full")}
            alt={work.title}
            onClick={toggleZoom}
            onMouseDown={startPan}
            onTouchStart={startTouchPan}
            onTouchMove={moveTouchPan}
            className="block max-h-full max-w-full touch-none object-contain select-none"
            style={{
              cursor: zoomCursor,
              boxShadow: "0 22px 60px rgba(20,20,15,0.09)",
              transition: "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            draggable={false}
          />
        ) : (
          <div
            onClick={(event) => event.stopPropagation()}
            className="slot max-h-full"
            style={{
              aspectRatio: work.ratio,
              width: `min(100%, calc((100vh - 220px) * ${work.ratio}))`,
              boxShadow: "0 22px 60px rgba(20,20,15,0.09)",
            }}
          >
            <span lang="en">{work.slot}</span>
          </div>
        )}
      </div>

      {noteExpanded && hasNote && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="lb-panel animate-fade-up"
          style={{ bottom: barHeight }}
        >
          <div className="mb-[14px] flex items-baseline justify-between gap-6">
            <div className="text-[9.5px] tracking-[0.2em] text-mute-3 uppercase">
              {t.noteHeading}
            </div>
            <button
              type="button"
              onClick={() => setNoteExpanded(false)}
              className="cursor-pointer text-[10px] tracking-[0.18em] text-mute-3 uppercase hover:text-ink"
            >
              {t.collapse}
            </button>
          </div>
          <p className="m-0 max-w-[74ch] text-[15px] leading-[1.78] text-pretty">
            {work.note}
          </p>
        </div>
      )}

      <div
        ref={barRef}
        onClick={(event) => event.stopPropagation()}
        className="lb-bar"
        style={{ height: noteShown ? BAR_OPEN : BAR_CLOSED }}
      >
        <div className="lb-info">
          <div className="lb-title">
            <div className="font-serif text-[19px] leading-[1.25]">
              {work.title}
              <span className="text-mute-2 italic">, {work.year}</span>
            </div>
            <div className="mt-[5px] text-[11px] tracking-[0.05em] text-mute-2">
              {work.caption}
            </div>
          </div>

          {noteShown && (
            <div className="lb-note">
              <p ref={noteRef} className="text-pretty">
                {work.note}
              </p>
              {noteClipped && (
                <button
                  type="button"
                  onClick={() => setNoteExpanded(true)}
                  className="cursor-pointer self-start border-b border-[#d9d7cf] pb-0.5 text-[10px] tracking-[0.18em] uppercase"
                >
                  {t.readMore}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lb-actions">
          <span className="mono-note">{counter}</span>
          {hasNote && (
            <button
              type="button"
              onClick={() => {
                setNoteOpen((open) => !open);
                setNoteExpanded(false);
              }}
              className="cursor-pointer text-[10px] tracking-[0.18em] uppercase"
              style={{
                color: noteOpen ? "var(--color-ink)" : "var(--color-mute-3)",
              }}
            >
              {noteOpen ? t.hideNote : t.showNote}
            </button>
          )}
          {works.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                className="cursor-pointer text-[10px] tracking-[0.18em] uppercase hover:text-mute"
              >
                {t.previous}
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="cursor-pointer text-[10px] tracking-[0.18em] uppercase hover:text-mute"
              >
                {t.next}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[10px] tracking-[0.18em] text-mute-3 uppercase hover:text-ink"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
