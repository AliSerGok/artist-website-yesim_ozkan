import { getMedia } from "./db";

/** Both variants written for every uploaded image. */
const VARIANTS = ["full", "grid"] as const;

/**
 * Removes images that a save has orphaned. Called with whatever a record
 * pointed at before the edit, minus whatever it points at now.
 */
export async function deleteImages(keys: (string | null)[]): Promise<void> {
  const gone = keys.filter((key): key is string => Boolean(key));
  if (gone.length === 0) return;

  const media = await getMedia();
  if (!media) return;

  await media.delete(
    gone.flatMap((key) => VARIANTS.map((variant) => `${key}-${variant}.webp`)),
  );
}

/** Keys present in `before` but not in `after`. */
export function orphaned(
  before: (string | null)[],
  after: (string | null)[],
): string[] {
  const kept = new Set(after.filter(Boolean));
  return before.filter((key): key is string => Boolean(key) && !kept.has(key));
}
