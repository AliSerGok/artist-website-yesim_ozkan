/**
 * Hashing for the one password this site has. Workers ship Web Crypto and
 * nothing else — no bcrypt, no argon2 — so PBKDF2-HMAC-SHA256 is the slow
 * function available. Its cost has to fit inside a Worker's CPU budget, which
 * is why the iteration count is well below what a long-lived server would use;
 * it is stored inside the hash, so raising it later leaves old hashes readable.
 *
 * Also imported by scripts/admin-user.ts, which runs on Node — keep it to
 * platform APIs both of them have.
 */

const ALGORITHM = "pbkdf2-sha256";
const ITERATIONS = 100_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  // Normalised, so a password typed with a composed "ğ" still matches one
  // stored with a decomposed one.
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );

  return new Uint8Array(bits);
}

/** Comparison that takes the same time whatever the first wrong byte is. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await derive(password, salt, ITERATIONS);
  return [ALGORITHM, ITERATIONS, toBase64(salt), toBase64(key)].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, iterations, salt, key] = stored.split("$");
  if (algorithm !== ALGORITHM) return false;

  const rounds = Number(iterations);
  if (!Number.isInteger(rounds) || rounds < 1 || !salt || !key) return false;

  try {
    const candidate = await derive(password, fromBase64(salt), rounds);
    return sameBytes(candidate, fromBase64(key));
  } catch {
    return false;
  }
}
