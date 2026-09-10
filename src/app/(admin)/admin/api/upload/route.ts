import { revalidatePath } from "next/cache";

import { getAdminIdentity } from "@/lib/admin-auth";
import { setWorkImage } from "@/lib/admin-db";
import { getWorkById } from "@/lib/content";
import { getMedia } from "@/lib/db";

const CACHE_FOREVER = "public, max-age=31536000, immutable";
const MAX_BYTES = 12 * 1024 * 1024;

async function removeVariants(media: R2Bucket, key: string | null) {
  if (!key) return;
  await media.delete([`${key}-full.webp`, `${key}-grid.webp`]);
}

export async function POST(request: Request) {
  if (!(await getAdminIdentity())) {
    return new Response("Not found", { status: 404 });
  }

  const media = await getMedia();
  if (!media) return new Response("R2 bağlı değil.", { status: 500 });

  const form = await request.formData();
  const workId = String(form.get("workId") ?? "");
  const full = form.get("full");
  const grid = form.get("grid");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  if (!workId || !(full instanceof File) || !(grid instanceof File)) {
    return new Response("Eksik veri.", { status: 400 });
  }
  if (full.size > MAX_BYTES || grid.size > MAX_BYTES) {
    return new Response("Görsel çok büyük.", { status: 413 });
  }
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return new Response("Geçersiz boyut.", { status: 400 });
  }

  const work = await getWorkById(workId);
  if (!work) return new Response("İş bulunamadı.", { status: 404 });

  const key = `works/${workId}/${Date.now().toString(36)}`;
  const options = {
    httpMetadata: {
      contentType: "image/webp",
      cacheControl: CACHE_FOREVER,
    },
  };

  await media.put(`${key}-full.webp`, await full.arrayBuffer(), options);
  await media.put(`${key}-grid.webp`, await grid.arrayBuffer(), options);

  await setWorkImage(workId, key, Math.round(width), Math.round(height));
  await removeVariants(media, work.imageKey);

  revalidatePath("/", "layout");

  return Response.json({ key, width, height });
}

export async function DELETE(request: Request) {
  if (!(await getAdminIdentity())) {
    return new Response("Not found", { status: 404 });
  }

  const media = await getMedia();
  if (!media) return new Response("R2 bağlı değil.", { status: 500 });

  const { workId } = (await request.json()) as { workId?: string };
  if (!workId) return new Response("Eksik veri.", { status: 400 });

  const work = await getWorkById(workId);
  if (!work) return new Response("İş bulunamadı.", { status: 404 });

  await removeVariants(media, work.imageKey);
  await setWorkImage(workId, null);

  revalidatePath("/", "layout");

  return Response.json({ ok: true });
}
