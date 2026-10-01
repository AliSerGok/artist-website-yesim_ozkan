-- Nine more techniques to choose a work or a series from: collage,
-- photography, sculpture, ceramics, textile, installation, video, digital art
-- and mixed media. The list itself lives in src/lib/types.ts and what each
-- name is called in either language in src/lib/dictionary.ts.
--
-- Both tables name the techniques they accept in a CHECK, and SQLite has no
-- way to widen one -- the tables have to be built again around it. The old
-- ones are renamed out of the way first rather than dropped as each new one
-- is made: works points at series, and dropping a table still pointed at
-- would leave the schema with a reference to nothing while the rest of this
-- file is read.

PRAGMA defer_foreign_keys = true;

ALTER TABLE works RENAME TO works_old;
ALTER TABLE series RENAME TO series_old;

CREATE TABLE series (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  medium        TEXT NOT NULL CHECK (medium IN (
                  'paintings', 'prints', 'paper', 'collage', 'photography',
                  'sculpture', 'ceramics', 'textile', 'installation',
                  'video', 'digital', 'mixed'
                )),
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
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  styles        TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO series (
  id, slug, medium, years, sort_order, title_tr, title_en, meta_tr, meta_en,
  note_tr, note_en, cover_work_id, published, created_at, updated_at, styles
)
SELECT
  id, slug, medium, years, sort_order, title_tr, title_en, meta_tr, meta_en,
  note_tr, note_en, cover_work_id, published, created_at, updated_at, styles
FROM series_old;

CREATE TABLE works (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  medium       TEXT NOT NULL CHECK (medium IN (
                 'paintings', 'prints', 'paper', 'collage', 'photography',
                 'sculpture', 'ceramics', 'textile', 'installation',
                 'video', 'digital', 'mixed'
               )),
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
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  styles       TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO works (
  id, slug, medium, series_id, year, sort_order, title_tr, title_en,
  caption_tr, caption_en, note_tr, note_en, width, height, slot, image_key,
  blur, published, created_at, updated_at, styles
)
SELECT
  id, slug, medium, series_id, year, sort_order, title_tr, title_en,
  caption_tr, caption_en, note_tr, note_en, width, height, slot, image_key,
  blur, published, created_at, updated_at, styles
FROM works_old;

-- Dropped in this order so neither drop leaves a reference behind: works_old
-- is the only thing pointing at series_old.
DROP TABLE works_old;
DROP TABLE series_old;

-- The indexes went with the renamed tables and were dropped along with them.
CREATE INDEX series_by_order ON series (sort_order);
CREATE INDEX works_by_order ON works (sort_order);
CREATE INDEX works_by_series ON works (series_id, sort_order);
CREATE INDEX works_by_medium ON works (medium, sort_order);
