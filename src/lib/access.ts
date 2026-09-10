import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Cloudflare Access sits in front of /admin, so an unauthorised visitor never
 * reaches this app at all. We verify the token it forwards as a second layer:
 * it stops anyone who finds a way to hit the Worker directly.
 */

const TOKEN_HEADER = "cf-access-jwt-assertion";
const TOKEN_COOKIE = "CF_Authorization";

export interface AdminIdentity {
  email: string;
}

function config() {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;
  return teamDomain && aud ? { teamDomain, aud } : null;
}

/** True when Access is not configured yet and we are on a dev machine. */
export function isUnprotectedDev(): boolean {
  return config() === null && process.env.NODE_ENV === "development";
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function keySet(teamDomain: string) {
  jwks ??= createRemoteJWKSet(
    new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
  );
  return jwks;
}

export async function verifyAccessToken(
  token: string | undefined,
): Promise<AdminIdentity | null> {
  const settings = config();
  if (!settings) return null;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, keySet(settings.teamDomain), {
      issuer: `https://${settings.teamDomain}`,
      audience: settings.aud,
    });

    const email = typeof payload.email === "string" ? payload.email : null;
    return email ? { email } : null;
  } catch {
    return null;
  }
}

export { TOKEN_COOKIE, TOKEN_HEADER };
