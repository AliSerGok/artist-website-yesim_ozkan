"use client";

import { useEffect, useRef } from "react";

const SKIN = "oklch(0.78 0.07 62)";
const HAIR = "oklch(0.4 0.09 330)";

/**
 * A small figure who stands on top of whatever the reader is pointing at —
 * any element marked `data-perch`. She turns to face the way she travelled.
 * Hidden on touch screens and whenever reduced motion is asked for.
 */
export function StudioDancer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dancer = ref.current;
    if (!dancer) return;

    let perchedOn: Element | null = null;
    let lastX: number | undefined;

    const perch = (node: Element | null) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width) return;

      perchedOn = node;
      // Stand a little in from the left edge, just above the top.
      const x = Math.round(rect.left + Math.min(rect.width * 0.5, 46) - 10);
      const y = Math.round(Math.max(2, rect.top - 42));

      dancer.style.opacity = "1";
      dancer.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${
        lastX !== undefined && x < lastX ? -1 : 1
      })`;
      lastX = x;
    };

    const onPointerOver = (event: Event) => {
      const node = (event.target as Element | null)?.closest?.("[data-perch]");
      if (node && node !== perchedOn) perch(node);
    };

    const onReflow = () => {
      if (perchedOn && document.contains(perchedOn)) perch(perchedOn);
    };

    document.addEventListener("mouseover", onPointerOver, true);
    window.addEventListener("scroll", onReflow, { passive: true });
    window.addEventListener("resize", onReflow);

    const settle = window.setTimeout(
      () => perch(document.querySelector("[data-perch]")),
      400,
    );

    return () => {
      document.removeEventListener("mouseover", onPointerOver, true);
      window.removeEventListener("scroll", onReflow);
      window.removeEventListener("resize", onReflow);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <div
      id="dancer"
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 80,
        width: 26,
        height: 40,
        pointerEvents: "none",
        opacity: 0,
        transition:
          "transform 640ms cubic-bezier(0.34, 1.35, 0.4, 1), opacity 300ms ease",
      }}
    >
      <div className="drift" style={{ position: "absolute", inset: 0 }}>
        <div
          className="body"
          style={{ position: "absolute", inset: 0, transformOrigin: "50% 92%" }}
        >
          <div
            className="hair"
            style={{
              position: "absolute",
              top: -1,
              left: 3,
              width: 8,
              height: 17,
              borderRadius: 4,
              background: HAIR,
              transformOrigin: "50% 8%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -2,
              left: 8,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: HAIR,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 1,
              left: 7,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: SKIN,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 2.5,
              left: 13.5,
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: "#fdfdfc",
            }}
          />
          <div
            className="arm-a"
            style={{
              position: "absolute",
              top: 13,
              left: 7,
              width: 2.2,
              height: 11,
              borderRadius: 2,
              background: SKIN,
              transformOrigin: "50% 0%",
            }}
          />
          <div
            className="arm-b"
            style={{
              position: "absolute",
              top: 13,
              left: 15,
              width: 2.2,
              height: 11,
              borderRadius: 2,
              background: SKIN,
              transformOrigin: "50% 0%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 11,
              left: 9,
              width: 6,
              height: 8,
              borderRadius: "3px 3px 1px 1px",
              background: "oklch(0.55 0.11 195)",
            }}
          />
          <div
            className="hips"
            style={{
              position: "absolute",
              top: 17,
              left: 0,
              right: 0,
              bottom: 0,
              transformOrigin: "50% 0%",
            }}
          >
            <div
              className="skirt"
              style={{
                position: "absolute",
                top: 0,
                left: 5,
                width: 16,
                height: 11,
                background: "oklch(0.72 0.14 82)",
                clipPath: "polygon(32% 0%, 68% 0%, 100% 100%, 0% 100%)",
                transformOrigin: "50% 0%",
              }}
            />
            <div
              className="leg-a"
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 2.4,
                height: 12,
                borderRadius: 2,
                background: SKIN,
                transformOrigin: "50% 0%",
              }}
            />
            <div
              className="leg-b"
              style={{
                position: "absolute",
                top: 10,
                left: 14,
                width: 2.4,
                height: 12,
                borderRadius: 2,
                background: SKIN,
                transformOrigin: "50% 0%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
