import { getAdminIdentity } from "@/lib/admin-auth";
import { getMedia } from "@/lib/db";

/**
 * Stores one already-resized image pair and hands back its key. Writing the
 * key onto a record — and cleaning up whatever it replaced — is the saving
 * action's job, so the same endpoint serves works, exhibitions and the blocks
 * of the about page, and nothing is destroyed before the form is submitted.
 */

const CACHE_FOREVER = "public, max-age=31536000, immutable";
const MAX_BYTES = 12 * 1024 * 1024;

/** Only the prefixes the panel is allowed to write to. */
const PREFIX = /^(works\/[A-Za-z0-9_-]{1,64}|exhibitions\/[A-Za-z0-9_-]{1,64}|pages\/about)$/;

export async function POST(request: Request) {
  if (!(await getAdminIdentity())) {
    return new Response("Not found", { status: 404 });
  }

  const media = await getMedia();
  if (!media) return new Response("R2 bağlı değil.", { status: 500 });

  const form = await request.formData();
  const prefix = String(form.get("prefix") ?? "");
  const full = form.get("full");
  const grid = form.get("grid");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  if (!PREFIX.test(prefix)) {
    return new Response("Geçersiz hedef.", { status: 400 });
  }
  if (!(full instanceof File) || !(grid instanceof File)) {
    return new Response("Eksik veri.", { status: 400 });
  }
  if (full.size > MAX_BYTES || grid.size > MAX_BYTES) {
    return new Response("Görsel çok büyük.", { status: 413 });
  }
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return new Response("Geçersiz boyut.", { status: 400 });
  }

  const key = `${prefix}/${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const options = {
    httpMetadata: { contentType: "image/webp", cacheControl: CACHE_FOREVER },
  };

  await media.put(`${key}-full.webp`, await full.arrayBuffer(), options);
  await media.put(`${key}-grid.webp`, await grid.arrayBuffer(), options);

  return Response.json({
    key,
    width: Math.round(width),
    height: Math.round(height),
  });
}
