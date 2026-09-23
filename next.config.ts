import type { NextConfig } from "next";

import { DEFAULT_LANG } from "./src/lib/i18n";

const nextConfig: NextConfig = {
  images: {
    // Images are served straight from R2 through our own /media route.
    unoptimized: true,
  },
  async redirects() {
    return [{ source: "/", destination: `/${DEFAULT_LANG}`, permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "x-robots-tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

// Gives `next dev` the same D1/R2/KV bindings the Worker gets in production.
//
// Local by default: queries hit the miniflare copies under .wrangler/state, so a
// render costs no network round trips. Use `pnpm dev:remote` when you need the
// real Cloudflare resources — live content, at the cost of ~2s per render.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev({
  remoteBindings: process.env.CF_REMOTE === "1",
});
