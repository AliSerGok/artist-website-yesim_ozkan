import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * How the panel's actions say how it went. There are two ways out:
 *
 * `stay` is for the ones whose work lands on the page it was posted from — a
 * reorder, a block added, a page saved. Nothing navigates; the note is handed
 * back for components/admin/action-form.tsx to read out, and the admin keeps
 * their scroll position.
 *
 * `finish` is for the ones that genuinely leave, such as saving a work and
 * returning to the list. Those redirect with the line attached to the address,
 * and components/admin/toast.tsx reads it back out and wipes it.
 */

/** What an action that stays put answers with. */
export interface Note {
  note: string;
  tone: "ok" | "err";
}

/** Drops every cached page so a save shows up on the site immediately. */
export function purge() {
  revalidatePath("/", "layout");
}

/** What went wrong, in words the panel can print. */
function reason(cause: unknown): string {
  console.error(cause);
  return cause instanceof Error ? cause.message : "bilinmeyen bir hata";
}

/** Carries a line for the panel's toast bar through the redirect. */
export function noted(to: string, note: string, tone: "ok" | "err" = "ok") {
  const query = new URLSearchParams({
    toast: note,
    tone,
    // Two identical saves in a row still have to look different in the
    // address bar, or the second one is never announced.
    n: Date.now().toString(36),
  });
  return `${to}?${query}`;
}

/**
 * Runs a mutation and stays where it is. A failure keeps the page too, so
 * whatever was typed into the form is still there to try again with.
 */
export async function stay(
  note: string,
  work: () => Promise<void>,
): Promise<Note> {
  try {
    await work();
    purge();
    return { note, tone: "ok" };
  } catch (cause) {
    return { note: `Olmadı — ${reason(cause)}`, tone: "err" };
  }
}

/**
 * Runs a mutation and then leaves with something to say. When it goes wrong
 * the admin lands back on `back` with the reason on screen, rather than on a
 * blank error page.
 */
export async function finish(
  to: string,
  note: string,
  work: () => Promise<void>,
  back = to,
): Promise<never> {
  let failure: string | null = null;

  try {
    await work();
    purge();
  } catch (cause) {
    failure = reason(cause);
  }

  // redirect() throws to unwind, so it is kept out of the try above.
  redirect(failure ? noted(back, `Olmadı — ${failure}`, "err") : noted(to, note));
}
