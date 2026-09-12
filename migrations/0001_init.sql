-- Site content. Every row is written by the admin panel only.

CREATE TABLE series (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  medium        TEXT NOT NULL CHECK (medium IN ('paintings', 'prints', 'paper')),
  years         TEXT NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  title_tr      TEXT NOT NULL,
  title_en      TEXT NOT NULL,
  meta_tr       TEXT NOT NULL DEFAULT '',
  meta_en       TEXT NOT NULL DEFAULT '',
  note_tr       TEXT NOT NULL DEFAULT '',
  note_en       TEXT NOT NULL DEFAULT '',
  cover_work_id TEXT,
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX series_by_order ON series (sort_order);

CREATE TABLE works (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  medium       TEXT NOT NULL CHECK (medium IN ('paintings', 'prints', 'paper')),
  -- Works with a series are shown on that series' page, not in the main grid.
  series_id    TEXT REFERENCES series (id) ON DELETE SET NULL,
  year         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  title_tr     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  caption_tr   TEXT NOT NULL DEFAULT '',
  caption_en   TEXT NOT NULL DEFAULT '',
  note_tr      TEXT NOT NULL DEFAULT '',
  note_en      TEXT NOT NULL DEFAULT '',
  width        INTEGER NOT NULL DEFAULT 3,
  height       INTEGER NOT NULL DEFAULT 4,
  slot         TEXT NOT NULL DEFAULT '',
  image_key    TEXT,
  blur         TEXT,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX works_by_order ON works (sort_order);
CREATE INDEX works_by_series ON works (series_id, sort_order);
CREATE INDEX works_by_medium ON works (medium, sort_order);

-- The few shows that get a picture and a paragraph on the exhibitions page.
CREATE TABLE exhibitions (
  id           TEXT PRIMARY KEY,
  year         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  title_tr     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  venue_tr     TEXT NOT NULL DEFAULT '',
  venue_en     TEXT NOT NULL DEFAULT '',
  kind_tr      TEXT NOT NULL DEFAULT '',
  kind_en      TEXT NOT NULL DEFAULT '',
  note_tr      TEXT NOT NULL DEFAULT '',
  note_en      TEXT NOT NULL DEFAULT '',
  url          TEXT NOT NULL DEFAULT '',
  image_key    TEXT,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX exhibitions_by_order ON exhibitions (sort_order);

-- Sub-headings of the participation list on the about page. The artist names
-- and orders them herself: "Sergiler", "Yarışmalar", "Ödüller", …
CREATE TABLE cv_groups (
  id           TEXT PRIMARY KEY,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  title_tr     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX cv_groups_by_order ON cv_groups (sort_order);

-- The complete participation list, shown as plain lines under those headings.
CREATE TABLE cv_entries (
  id           TEXT PRIMARY KEY,
  -- Deleting a heading keeps its lines; they move above the first heading.
  group_id     TEXT REFERENCES cv_groups (id) ON DELETE SET NULL,
  year         TEXT NOT NULL,
  -- Ordered within its own heading, not across the whole list.
  sort_order   INTEGER NOT NULL DEFAULT 0,
  title_tr     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  -- Empty under headings where solo/group says nothing, e.g. competitions.
  kind         TEXT NOT NULL DEFAULT '' CHECK (kind IN ('', 'solo', 'group')),
  url          TEXT NOT NULL DEFAULT '',
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX cv_by_order ON cv_entries (group_id, sort_order);

-- Free-form singletons: 'about' and 'contact', stored as bilingual JSON.
CREATE TABLE pages (
  key          TEXT PRIMARY KEY,
  data         TEXT NOT NULL,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
