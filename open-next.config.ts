import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // Rendered pages live in KV until the artist saves a change.
  incrementalCache: kvIncrementalCache,
  // revalidateTag/revalidatePath from the admin panel purge through D1.
  tagCache: d1NextTagCache,
});
