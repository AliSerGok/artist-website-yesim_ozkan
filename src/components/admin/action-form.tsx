"use client";

import { useToast } from "@/components/admin/toast";
import type { Note } from "@/lib/flash";

/**
 * A form for an action that has nowhere to go: it saves, moves or deletes
 * something the page it was posted from is already showing.
 *
 * The action answers with a line rather than redirecting with one attached, so
 * nothing navigates — the page re-renders where it stands and the admin keeps
 * their place on it. See lib/flash.ts, where `stay` is the other half of this,
 * and `finish` stays the way out for the forms that really do leave.
 */
export function ActionForm({
  action,
  children,
  className,
  formKey,
}: {
  action: (form: FormData) => Promise<Note>;
  children: React.ReactNode;
  className?: string;
  /** A stamp of the saved content; see lib/revision.ts for why it is here. */
  formKey?: string;
}) {
  const push = useToast();

  return (
    <form
      key={formKey}
      className={className}
      action={async (data) => {
        const { note, tone } = await action(data);
        push(note, tone);
      }}
    >
      {children}
    </form>
  );
}
