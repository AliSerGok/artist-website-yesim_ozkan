/** Public origin, used for canonical URLs and the sitemap. */
export const SITE_URL = (
  process.env.SITE_URL ?? "https://yesimozkan.com"
).replace(/\/$/, "");
