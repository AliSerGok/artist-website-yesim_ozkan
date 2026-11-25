/** Public origin, used for canonical URLs and the sitemap. */
export const SITE_URL = (
  process.env.SITE_URL ?? "https://yesimozkan.com"
).replace(/\/$/, "");

/**
 * Sergiler bölümü şimdilik kapalı: sitede sekme ve sayfalar, panelde sekme ve
 * kart görünmez. Veriler yerinde durur — geri açmak için true yap.
 */
export const EXHIBITIONS_ENABLED = false;
