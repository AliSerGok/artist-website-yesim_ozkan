import { cookies } from "next/headers";

import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./password";

/**
 * Who may open the panel. One account, a password she can change, and a
 * cookie that remembers the browser she uses.
 *
 * The cookie carries a random token; the database stores only its SHA-256, so
 * a leaked copy of the database opens nobody's session. Every page under
 * /admin and every action that writes checks it again — see requireAdmin.
 */

const COOKIE = "yesim_admin";
/** The cookie is scoped to the panel, so the public site never receives it. */
const COOKIE_PATH = "/admin";
const SESSION_DAYS = 30;

/** Wrong guesses in a row before the account stops answering for a while. */
const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;

export const PASSWORD_MIN = 8;

/** Said to a visitor whatever went wrong: the form gives nothing away. */
const REFUSED = "E-posta veya şifre hatalı.";

export interface AdminIdentity {
  id: string;
  email: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  fail_count: number;
  locked_until: string | null;
}

async function requireDb(): Promise<D1Database> {
  const db = await getDb();
  if (!db) {
    throw new Error("veritabanı bağlı değil (npm run db:migrate:local)");
  }
  return db;
}

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** The same shape SQLite's datetime('now') produces, so the two compare. */
const stamp = (date: Date) => date.toISOString().slice(0, 19).replace("T", " ");

const normalise = (email: string) => email.trim().toLowerCase();

function newToken(): string {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

/** What the database keeps instead of the token itself. */
async function fingerprint(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return hex(new Uint8Array(digest));
}

function checkEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("e-posta adresi geçerli görünmüyor");
  }
}

function checkPassword(password: string): void {
  if (password.length < PASSWORD_MIN) {
    throw new Error(`şifre en az ${PASSWORD_MIN} karakter olmalı`);
  }
}

/* ------------------------------------------------------------- reading */

/**
 * The signed-in admin, or null. Safe to call anywhere on the server; it is a
 * cookie read and one indexed lookup.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT u.id AS id, u.email AS email
         FROM admin_sessions s
         JOIN admin_users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .bind(await fingerprint(token))
    .first<AdminIdentity>();

  return row ?? null;
}

/** The lock repeated at the point of writing, where it matters most. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) throw new Error("oturumun kapanmış, tekrar giriş yap");
  return identity;
}

/**
 * How many accounts exist, or null when the database is not reachable. The
 * login screen uses it to explain itself before there is anyone to let in.
 */
export async function adminCount(): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const row = await db
      .prepare(`SELECT COUNT(*) AS total FROM admin_users`)
      .first<{ total: number }>();
    return row?.total ?? 0;
  } catch {
    // The table is missing: migrations have not been applied yet.
    return null;
  }
}

/* ------------------------------------------------------------ sessions */

async function openSession(db: D1Database, userId: string): Promise<void> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db
    .prepare(
      `INSERT INTO admin_sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, ?)`,
    )
    .bind(await fingerprint(token), userId, stamp(expires))
    .run();

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // http://localhost never receives a cookie marked secure.
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    expires,
  });
}

/**
 * Checks the credentials and, when they are right, opens a session. Returns
 * the reason to show on the form, or null when the visitor is in.
 *
 * Must be called from a server action or route handler: it writes a cookie.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<string | null> {
  const db = await requireDb();

  const user = await db
    .prepare(
      `SELECT id, email, password_hash, fail_count, locked_until
         FROM admin_users WHERE email = ?`,
    )
    .bind(normalise(email))
    .first<UserRow>();

  if (!user) {
    // Spend what a real account would have cost, so an unknown address and a
    // wrong password take the same time to refuse.
    await hashPassword(password);
    return REFUSED;
  }

  if (user.locked_until && user.locked_until > stamp(new Date())) {
    return `Çok fazla hatalı deneme. ${LOCK_MINUTES} dakika sonra tekrar deneyin.`;
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    // Counting up to the lock, then starting the count again, so one lock
    // does not leave the account one mistake away from the next.
    await db
      .prepare(
        `UPDATE admin_users
            SET fail_count = CASE WHEN fail_count + 1 >= ? THEN 0
                                  ELSE fail_count + 1 END,
                locked_until = CASE WHEN fail_count + 1 >= ?
                                    THEN datetime('now', ?)
                                    ELSE locked_until END,
                updated_at = datetime('now')
          WHERE id = ?`,
      )
      .bind(MAX_FAILURES, MAX_FAILURES, `+${LOCK_MINUTES} minutes`, user.id)
      .run();
    return REFUSED;
  }

  await db
    .prepare(
      `UPDATE admin_users SET fail_count = 0, locked_until = NULL WHERE id = ?`,
    )
    .bind(user.id)
    .run();

  // Someone is here anyway; clear out whatever has run out.
  await db
    .prepare(`DELETE FROM admin_sessions WHERE expires_at <= datetime('now')`)
    .run();

  await openSession(db, user.id);
  return null;
}

/** Closes this browser's session and forgets the cookie. */
export async function signOut(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  if (token) {
    const db = await getDb();
    await db
      ?.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`)
      .bind(await fingerprint(token))
      .run();
  }

  // Set rather than delete: the cookie lives on /admin, and a delete by name
  // alone would be written for / and leave it in place.
  store.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: 0,
  });
}

/* ------------------------------------------------------------- account */

async function currentPassword(
  db: D1Database,
  id: string,
  password: string,
): Promise<void> {
  const row = await db
    .prepare(`SELECT password_hash FROM admin_users WHERE id = ?`)
    .bind(id)
    .first<{ password_hash: string }>();

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new Error("mevcut şifre yanlış");
  }
}

/**
 * Changes the password after proving the old one. Every other browser that
 * was signed in is signed out — that is the point of changing it.
 */
export async function changePassword(
  admin: AdminIdentity,
  current: string,
  next: string,
  repeat: string,
): Promise<void> {
  const db = await requireDb();
  await currentPassword(db, admin.id, current);

  if (next !== repeat) throw new Error("yeni şifre iki alanda aynı değil");
  if (next === current) throw new Error("yeni şifre eskisiyle aynı");
  checkPassword(next);

  await db
    .prepare(
      `UPDATE admin_users
          SET password_hash = ?, fail_count = 0, locked_until = NULL,
              updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(await hashPassword(next), admin.id)
    .run();

  const token = (await cookies()).get(COOKIE)?.value;
  await db
    .prepare(
      `DELETE FROM admin_sessions WHERE user_id = ? AND token_hash IS NOT ?`,
    )
    .bind(admin.id, token ? await fingerprint(token) : "")
    .run();
}

/** Changes the address used to sign in; the password proves it is her. */
export async function changeEmail(
  admin: AdminIdentity,
  email: string,
  password: string,
): Promise<string> {
  const db = await requireDb();
  await currentPassword(db, admin.id, password);

  const next = normalise(email);
  checkEmail(next);

  const taken = await db
    .prepare(`SELECT id FROM admin_users WHERE email = ? AND id IS NOT ?`)
    .bind(next, admin.id)
    .first<{ id: string }>();
  if (taken) throw new Error("bu e-posta başka bir hesapta kullanılıyor");

  await db
    .prepare(
      `UPDATE admin_users SET email = ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(next, admin.id)
    .run();

  return next;
}

/** Signs every browser out, this one included. */
export async function closeAllSessions(admin: AdminIdentity): Promise<void> {
  const db = await requireDb();
  await db
    .prepare(`DELETE FROM admin_sessions WHERE user_id = ?`)
    .bind(admin.id)
    .run();
}
