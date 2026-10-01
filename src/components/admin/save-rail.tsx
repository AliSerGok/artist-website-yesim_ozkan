"use client";

import { useEffect, useState } from "react";

/**
 * Kaydet, kept within reach: a second one standing in the empty column to
 * the left of the panel, so a long page can be saved from wherever it is
 * being read rather than from its foot.
 *
 * It decides nothing of its own. The page's own save button already knows
 * whether there is anything to save -- see save-button.tsx -- so this one
 * watches that button, wears the same state and, when pressed, presses it.
 * A page without one (the lists, the login screen) shows no rail at all.
 */
export function SaveRail() {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    const read = () => {
      const found = document.querySelector<HTMLButtonElement>("[data-save]");
      setButton(found);
      setIdle(!found || found.disabled);
    };

    read();

    // The button comes and goes with the page, and wakes up on its own the
    // moment the form differs from what it was.
    const watch = new MutationObserver(read);
    watch.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["disabled", "data-busy"],
    });

    return () => watch.disconnect();
  }, []);

  if (!button) return null;

  return (
    <div className="adm-rail">
      <button
        type="button"
        className="adm-btn adm-btn-primary w-full justify-center"
        disabled={idle}
        title={idle ? "Değiştirdiğin bir şey yok" : undefined}
        onClick={() => button.click()}
      >
        Kaydet
      </button>
      <p className="adm-note mt-2 leading-[1.5]">
        {idle ? "Değişiklik yok." : "Kaydedilmemiş değişiklik var."}
      </p>
    </div>
  );
}
