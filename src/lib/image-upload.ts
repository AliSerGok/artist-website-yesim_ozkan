/**
 * What the panel does to a picture before it ever reaches R2: the chosen
 * region is cut out, downscaled and re-encoded in the browser, so the bucket
 * only ever holds web-sized WebP and never the part that was cropped away.
 *
 * Browser-only — every function here wants a canvas. Both the single slot
 * (components/admin/image-field.tsx) and the bulk drop on a series page
 * (components/admin/bulk-upload.tsx) go through it, so an image uploaded
 * either way is stored exactly the same.
 */

/** A rectangle in the source image's own pixels. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What an upload answers with: where it landed, and at what size. */
export interface Stored {
  key: string;
  width: number;
  height: number;
}

const FULL_EDGE = 2400;
const GRID_EDGE = 900;

interface Rendered {
  blob: Blob;
  width: number;
  height: number;
}

async function render(
  source: ImageBitmap,
  area: CropArea,
  maxEdge: number,
): Promise<Rendered> {
  const scale = Math.min(1, maxEdge / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tarayıcı görseli işleyemedi.");
  context.drawImage(
    source,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Görsel dönüştürülemedi.");

  return { blob, width, height };
}

/**
 * Stores one picture under `prefix` and hands back its key. Writing that key
 * onto a record — and clearing up whatever it replaced — is the saving
 * action's job, so nothing is destroyed before a form is submitted.
 */
export async function uploadImage(
  prefix: string,
  file: Blob,
  area: CropArea | null,
): Promise<Stored> {
  const bitmap = await createImageBitmap(file);
  const region = area ?? {
    x: 0,
    y: 0,
    width: bitmap.width,
    height: bitmap.height,
  };

  const [full, grid] = await Promise.all([
    render(bitmap, region, FULL_EDGE),
    render(bitmap, region, GRID_EDGE),
  ]);
  bitmap.close();

  const body = new FormData();
  body.append("prefix", prefix);
  body.append("full", full.blob, "full.webp");
  body.append("grid", grid.blob, "grid.webp");
  body.append("width", String(full.width));
  body.append("height", String(full.height));

  const response = await fetch("/admin/api/upload", { method: "POST", body });
  if (!response.ok) throw new Error(await response.text());

  const result = (await response.json()) as { key: string };
  return { key: result.key, width: full.width, height: full.height };
}

/** A file's own name, as a first guess at a title: "Leğendeki Su.jpg" → "Leğendeki Su". */
export function titleFromFile(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim();
}
