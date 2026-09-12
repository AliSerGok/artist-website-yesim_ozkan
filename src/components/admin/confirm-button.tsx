"use client";

import { SubmitButton } from "@/components/admin/submit-button";

/** A delete button that asks first and then shows it is working. */
export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <SubmitButton
      className={className ?? "adm-btn adm-btn-danger"}
      confirm={message}
      busyLabel="Siliniyor…"
    >
      {children}
    </SubmitButton>
  );
}
