/** Public URL for an uploaded image variant. */
export function mediaUrl(key: string, variant: "full" | "grid"): string {
  return `/media/${key}-${variant}.webp`;
}
