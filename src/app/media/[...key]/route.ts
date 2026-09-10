import { getMedia } from "@/lib/db";

/** Serves uploaded images straight out of R2. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const path = key.join("/");

  // Only ever read from the prefixes the admin panel writes to.
  if (!/^(works|pages)\//.test(path) || path.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const media = await getMedia();
  if (!media) return new Response("Not found", { status: 404 });

  const object = await media.get(path);
  if (!object) return new Response("Not found", { status: 404 });

  // Build the headers by hand rather than with writeHttpMetadata: the latter
  // cannot take a Node Headers object across the binding proxy in `next dev`.
  const headers = new Headers({
    "content-type":
      object.httpMetadata?.contentType ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    etag: object.httpEtag,
  });

  return new Response(object.body, { headers });
}
