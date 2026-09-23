/**
 * Opens the panel account, or resets its password when it is forgotten.
 *
 *   node scripts/admin-user.ts --email yesim@site.com --password "…"
 *   node scripts/admin-user.ts --email eski@site.com --remove
 *
 * The password is hashed here and only the hash is sent to D1. Safe to
 * re-run: an address that already exists keeps its id, takes the new
 * password, and has its open sessions closed.
 *
 * It writes to the Cloudflare database, the one `next dev` reads too (the
 * bindings in wrangler.jsonc are remote). Pass --local for the local copy,
 * where it falls back to a throwaway account if no address is given.
 */
import { execFileSync } from "node:child_process";

import { hashPassword } from "../src/lib/password.ts";

const DATABASE = "yesim-content";
const MIN_PASSWORD = 8;

/** Only ever used on the local database, and printed when it is. */
const LOCAL_FALLBACK = { email: "yesim@yerel.test", password: "yesim1234" };

// --remote is still accepted, and is what everything does by default now.
const local = process.argv.includes("--local");
const remove = process.argv.includes("--remove");
const target = local ? "--local" : "--remote";

function argument(name: string): string {
  const at = process.argv.indexOf(`--${name}`);
  const value = at === -1 ? "" : (process.argv[at + 1] ?? "");
  return value.startsWith("--") ? "" : value;
}

const fallback = local && !argument("email") && !argument("password");
const email = (fallback ? LOCAL_FALLBACK.email : argument("email"))
  .trim()
  .toLowerCase();
const password = fallback ? LOCAL_FALLBACK.password : argument("password");

function stop(reason: string): never {
  console.error(`${reason}

  node scripts/admin-user.ts --email adres@site.com --password "…" [--local]
  node scripts/admin-user.ts --email adres@site.com --remove [--local]`);
  process.exit(1);
}

if (!email) stop("E-posta gerekli.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) stop(`Geçersiz e-posta: ${email}`);
if (!remove) {
  if (!password) stop("Şifre gerekli.");
  if (password.length < MIN_PASSWORD) {
    stop(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`);
  }
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

const run = (sql: string) =>
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DATABASE, target, "--yes", "--command", sql],
    { stdio: "inherit" },
  );

if (remove) {
  // The sessions go with it: ON DELETE CASCADE needs a pragma D1 does not
  // promise, so they are cleared by hand.
  run(
    `DELETE FROM admin_sessions WHERE user_id IN
       (SELECT id FROM admin_users WHERE email = ${quote(email)});`,
  );
  run(`DELETE FROM admin_users WHERE email = ${quote(email)};`);
} else {
  const id = `adm_${crypto.randomUUID().slice(0, 12)}`;
  const hash = await hashPassword(password);

  run(
    `INSERT INTO admin_users (id, email, password_hash)
     VALUES (${quote(id)}, ${quote(email)}, ${quote(hash)})
     ON CONFLICT (email) DO UPDATE SET
       password_hash = excluded.password_hash,
       fail_count = 0,
       locked_until = NULL,
       updated_at = datetime('now');`,
  );

  // A password that has just been reset should not leave a browser signed in.
  run(
    `DELETE FROM admin_sessions WHERE user_id IN
       (SELECT id FROM admin_users WHERE email = ${quote(email)});`,
  );
}

// Printed every time: the panel can change its own address, so the account
// you meant to reset is not always the one you typed.
const listing = execFileSync(
  "npx",
  [
    "wrangler", "d1", "execute", DATABASE, target, "--yes", "--json",
    "--command", "SELECT email FROM admin_users ORDER BY email;",
  ],
  { encoding: "utf8" },
);

const accounts = (JSON.parse(listing) as { results: { email: string }[] }[])
  .flatMap((page) => page.results)
  .map((row) => row.email);

console.log(
  `\n${remove ? "Silindi" : "Hesap hazır"} (${local ? "yerel" : "Cloudflare"}): ${email}` +
    (!remove && fallback
      ? `\nŞifre: ${password}  — yalnızca yerel geliştirme için.`
      : "") +
    `\nBu veritabanındaki hesaplar: ${accounts.join(", ") || "yok"}`,
);
