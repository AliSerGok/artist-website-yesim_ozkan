/**
 * A short stamp for a value, which changes whenever the value does.
 *
 * The panel's long forms are uncontrolled: the browser, not React, holds what
 * has been typed. Re-rendering after a save therefore leaves the fields as
 * they were, which is right until a delete or a move shifts everything up by
 * one — then field three is still showing what block three used to say. The
 * forms carry this stamp as their key, so a save that rearranged anything
 * rebuilds them from what was actually stored.
 */
export function revision(value: unknown): string {
  const text = JSON.stringify(value) ?? "";

  // FNV-1a, 32 bit. Nothing here is security-sensitive; it only has to differ
  // when the content differs.
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
