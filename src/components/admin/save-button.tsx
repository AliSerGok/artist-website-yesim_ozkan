"use client";

import { useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/admin/submit-button";

/**
 * Kaydet, greyed out until there is something to save.
 *
 * It reads the whole form rather than watching named fields, so it does not
 * have to be told about every input the panel grows. What the form would post
 * is compared against what it would have posted when the page arrived; the
 * moment the two differ the button wakes up.
 */

/** Everything the form would send, flattened so two of them can be compared. */
function shape(form: HTMLFormElement): string {
  const lines: string[] = [];

  for (const [key, value] of new FormData(form)) {
    // A picked file is already on its way to R2; what lands in the record is
    // the key beside it, which is a string like everything else here.
    if (typeof value === "string") lines.push(JSON.stringify([key, value]));
  }

  return lines.join("\n");
}

export function SaveButton({
  children = "Kaydet",
  busyLabel = "Kaydediliyor…",
  className = "adm-btn adm-btn-primary",
  idleTitle = "Değiştirdiğin bir şey yok",
  name,
  value,
}: {
  children?: React.ReactNode;
  busyLabel?: string;
  className?: string;
  /** For a form that tells its buttons apart by what they post. */
  name?: string;
  value?: string;
  /** Why the button is asleep, for whoever hovers it to ask. */
  idleTitle?: string;
}) {
  const seat = useRef<HTMLSpanElement>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = seat.current?.closest("form");
    if (!form) return;

    const saved = shape(form);
    const check = () => setDirty(shape(form) !== saved);

    form.addEventListener("input", check);
    form.addEventListener("change", check);

    // Typing is not the only way a field changes. An uploaded picture's key,
    // its measured size, a row added or dropped — React writes those itself
    // and no input event follows, so watch the form's shape as well.
    const watch = new MutationObserver(check);
    watch.observe(form, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value", "checked"],
    });

    return () => {
      form.removeEventListener("input", check);
      form.removeEventListener("change", check);
      watch.disconnect();
    };
  }, []);

  return (
    // Laid out as if it were not here, so the button sits where it always did.
    <span ref={seat} className="contents">
      <SubmitButton
        name={name}
        value={value}
        className={className}
        busyLabel={busyLabel}
        disabled={!dirty}
        title={dirty ? undefined : idleTitle}
      >
        {children}
      </SubmitButton>
    </span>
  );
}
