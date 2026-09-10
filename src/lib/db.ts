import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * The D1 binding, or null when running without Cloudflare bindings
 * (a plain `next dev` before the local database has been created).
 */
export async function getDb(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export async function getMedia(): Promise<R2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.MEDIA ?? null;
  } catch {
    return null;
  }
}
