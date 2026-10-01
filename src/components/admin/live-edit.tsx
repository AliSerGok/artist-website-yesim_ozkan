"use client";

import { useEffect, useRef } from "react";

/**
 * Two things the panel's edit pages need a browser for.
 *
 * The first is the preview: a menu changed here writes its answer straight
 * onto the picture of the field above it, so the face, the width, the edge,
 * the size and the words themselves are seen before anything is saved. Only
 * the attributes globals.css already answers are written, so a preview
 * cannot drift from what the page will do with the same text.
 *
 * The second is the scroll. The cards of a page are one exclusive accordion
 * -- opening one shuts the other -- and the one that shuts is often above
 * the one that opened, which would slide the page out from under the
 * pointer. The row that was clicked is held exactly where it was.
 */

/** Which data attribute each control writes on the preview. */
const ATTRIBUTE: Record<string, string> = {
  width: "data-width",
  align: "data-align",
  alignY: "data-align-y",
  size: "data-size",
  font: "data-font",
  bold: "data-bold",
  italic: "data-italic",
};

/** A paragraph break, read the way a save reads it. */
const BREAK = /\n\s*\n/;

/** The three kinds of field that can speak for a preview. */
type Control = HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement;

/** A switch says what it says by being on; everything else by its value. */
const valueOf = (field: Control) =>
  field instanceof HTMLInputElement && field.type === "checkbox"
    ? field.checked
      ? "true"
      : ""
    : field.value;

export function LiveEdit({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    /** The part of this card's preview that the control speaks for. */
    const previewFor = (field: Control): HTMLElement | null => {
      const preview = field
        .closest("[data-card]")
        ?.querySelector("[data-preview]");
      if (!preview) return null;

      const part = field.getAttribute("data-live-target");
      return part
        ? preview.querySelector<HTMLElement>(part)
        : (preview.firstElementChild as HTMLElement | null);
    };

    const onInput = (event: Event) => {
      const field = event.target;
      if (
        !(field instanceof HTMLSelectElement) &&
        !(field instanceof HTMLTextAreaElement) &&
        !(field instanceof HTMLInputElement)
      ) {
        return;
      }

      const kind = field.dataset.live;
      if (!kind) return;

      const target = previewFor(field);
      if (!target) return;

      const value = valueOf(field);

      if (kind === "line") {
        target.textContent = value;
        return;
      }

      if (kind === "text") {
        target.replaceChildren(
          ...value
            .split(BREAK)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => {
              const line = document.createElement("p");
              line.textContent = paragraph;
              return line;
            }),
        );
        return;
      }

      const attribute = ATTRIBUTE[kind];
      if (!attribute) return;

      // Nothing chosen writes nothing, the way an unstyled page is written.
      if (!value || value === "default") target.removeAttribute(attribute);
      else target.setAttribute(attribute, value);
    };

    const onClick = (event: MouseEvent) => {
      const node = event.target;
      if (!(node instanceof HTMLElement)) return;

      const summary = node.closest("summary");
      if (!summary || !root.contains(summary)) return;

      // Measured before the browser has folded anything, compared after.
      const before = summary.getBoundingClientRect().top;
      requestAnimationFrame(() => {
        const after = summary.getBoundingClientRect().top;
        if (after !== before) window.scrollBy(0, after - before);
      });
    };

    root.addEventListener("input", onInput);
    root.addEventListener("click", onClick);

    return () => {
      root.removeEventListener("input", onInput);
      root.removeEventListener("click", onClick);
    };
  }, []);

  // Nothing of its own in the layout: the cards keep the form's own spacing.
  return (
    <div ref={host} className="contents">
      {children}
    </div>
  );
}
