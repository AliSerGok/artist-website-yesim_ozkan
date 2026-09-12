"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that admits it was pressed: it goes busy, the rest of the
 * form locks, and a double click cannot post the same thing twice.
 *
 * The about page hangs a dozen buttons off one form and `useFormStatus`
 * reports one pending state for all of them — so a named button asks the
 * posted data whether the press was its own.
 */
export function SubmitButton({
  children,
  busyLabel,
  confirm,
  className = "adm-btn",
  name,
  value,
  disabled = false,
  title,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  /** Shown while the action runs, when the label has room for it. */
  busyLabel?: string;
  /** Asks first; the form is only posted on an approval. */
  confirm?: string;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
}) {
  const { pending, data } = useFormStatus();
  const mine = name ? data?.get(name) === value : true;
  const busy = pending && mine;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      // Never disabled at click time — a control that disables itself
      // mid-click never submits at all.
      disabled={disabled || pending}
      data-busy={busy ? "true" : undefined}
      aria-busy={busy}
      aria-label={ariaLabel}
      title={title}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}
