-- The panel's own lock: an account with a password, and the sessions it opens.

CREATE TABLE admin_users (
  id            TEXT PRIMARY KEY,
  -- NOCASE so "Yesim@..." and "yesim@..." can never become two accounts.
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  -- pbkdf2-sha256$<iterations>$<salt>$<derived key>, see src/lib/password.ts.
  password_hash TEXT NOT NULL,
  -- Wrong guesses in a row; cleared by the first correct one.
  fail_count    INTEGER NOT NULL DEFAULT 0,
  -- Set once there have been too many, so guessing has to wait it out.
  locked_until  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per browser that is signed in. The cookie holds a random token and
-- this table only its SHA-256, so a copy of the database opens no session.
CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX admin_sessions_by_user ON admin_sessions (user_id);
