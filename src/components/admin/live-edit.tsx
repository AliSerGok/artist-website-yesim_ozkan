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
      if (part) return preview.querySelector<HTMLElement>(part);

      /*
       * A control that names the fields it dresses has said exactly what it
       * speaks for -- its own card's preview is one of them. Falling back to
       * the whole preview would dress everything inside it, and a bold name
       * would drag the line under it along.
       */
      if (field.getAttribute("data-live-fields")) return null;

      return preview.firstElementChild as HTMLElement | null;
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

      // A face shared by a whole page has no preview of its own to speak
      // for; it writes onto every field it dresses instead.
      const target = previewFor(field);
      const value = valueOf(field);

      /*
       * A preview shows one language at a time. Typing into the English of
       * a pair swings it over to English and says so on the card, so what
       * is being typed is always what is being looked at; the next save
       * brings the card back to the Turkish the site opens with.
       */
      const lang = field.dataset.liveLang;
      if (lang) {
        const badge = field.closest("[data-card]")?.querySelector(".adm-lang");
        if (badge) badge.textContent = lang.toUpperCase();
      }

      if (kind === "line") {
        if (target) target.textContent = value;
        return;
      }

      // One line each, the way a künye column is read back.
      if (target && (kind === "lines" || kind === "text")) {
        const parts = kind === "lines" ? value.split("\n") : value.split(BREAK);

        target.replaceChildren(
          ...parts
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              const line = document.createElement(
                kind === "lines" ? "div" : "p",
              );
              line.textContent = part;
              return line;
            }),
        );
        return;
      }

      const attribute = ATTRIBUTE[kind];
      if (!attribute) return;

      // Nothing chosen writes nothing, the way an unstyled page is written.
      const write = (node: Element) => {
        if (!value || value === "default") node.removeAttribute(attribute);
        else node.setAttribute(attribute, value);
      };

      if (target) write(target);

      /*
       * A face is worn by the boxes it is typed into as well, so the words
       * are written in the face they will be read in.
       */
      const fields = field.getAttribute("data-live-fields");
      if (fields) {
        // Across the whole form, not just this card: a work's year is typed
        // in the settings beside it, where the face chosen for it is too.
        field.closest("form")?.querySelectorAll(fields).forEach(write);
      }
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
