import { cookies, headers } from "next/headers";

import {
  TOKEN_COOKIE,
  TOKEN_HEADER,
  isUnprotectedDev,
  verifyAccessToken,
  type AdminIdentity,
} from "./access";

/**
 * Server-side check for admin pages and server actions. The proxy already
 * blocks unauthenticated requests; this repeats the check at the point of
 * writing so a mutation can never run unverified.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  if (isUnprotectedDev()) return { email: "yerel@gelistirme" };

  const headerList = await headers();
  const token =
    headerList.get(TOKEN_HEADER) ??
    (await cookies()).get(TOKEN_COOKIE)?.value ??
    undefined;

  return verifyAccessToken(token);
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) throw new Error("Yetkisiz istek");
  return identity;
}
