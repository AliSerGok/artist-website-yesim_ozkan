"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";

/**
 * A submit button that admits it was pressed: it goes busy, the rest of the
 * form locks, and a double click cannot post the same thing twice.
 *
 * The about page hangs a dozen buttons off one form and `useFormStatus`
 * reports one pending state for all of them — so a named button asks the
 * posted data whether the press was its own.
 *
 * Given `confirm`, it asks first — in the panel's own dialog rather than the
 * browser's grey box. Everything that asks is something that cannot be taken
 * back, so the approving button is the dangerous-looking one and the cursor
 * starts on the way out.
 */
export function SubmitButton({
  children,
  busyLabel,
  confirm,
  confirmTitle = "Emin misin?",
  confirmLabel,
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
  /** The line above the question. */
  confirmTitle?: string;
  /** What the approving button says; the pressed button's own words by default. */
  confirmLabel?: string;
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

  const heading = useId();
  const button = useRef<HTMLButtonElement>(null);
  const ask = useRef<HTMLDialogElement>(null);
  /** Set while an approved press goes back through, so it is asked once. */
  const approved = useRef(false);

  const settle = (go: boolean) => {
    ask.current?.close();
    if (!go) return;

    // requestSubmit rather than a second click: it carries the button's own
    // name and value, the way a real press would, and raises no click for
    // this handler to catch all over again.
    const element = button.current;
    approved.current = true;
    element?.form?.requestSubmit(element);
    approved.current = false;
  };

  return (
    <>
      <button
        ref={button}
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
          if (!confirm || approved.current) return;
          event.preventDefault();
          ask.current?.showModal();
        }}
      >
        {busy && busyLabel ? busyLabel : children}
      </button>

      {confirm && (
        <dialog
          ref={ask}
          className="adm-ask"
          aria-labelledby={heading}
          // A click that lands on the dialog itself landed on the backdrop.
          onClick={(event) => {
            if (event.target === ask.current) settle(false);
          }}
        >
          <div className="adm-ask-body">
            <h2 id={heading} className="adm-ask-title">
              {confirmTitle}
            </h2>
            <p className="adm-ask-text">{confirm}</p>
          </div>

          <div className="adm-ask-foot">
            {/* The way out is where the cursor lands and where Esc leads. */}
            <button
              type="button"
              className="adm-btn"
              autoFocus
              onClick={() => settle(false)}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-danger"
              onClick={() => settle(true)}
            >
              {confirmLabel ?? (typeof children === "string" ? children : "Devam")}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
