-- The face a written field is set in, chosen per row in the panel.
--
-- One column per table rather than one per field: it holds a small JSON
-- object keyed by the field it dresses -- {"title":{"font":"georgia",
-- "bold":true,"italic":false}} -- so a new field needs no new column, and a
-- row nobody has restyled keeps an empty object and is drawn the way the
-- page has always drawn it. See src/lib/type-style.ts.

ALTER TABLE works       ADD COLUMN styles TEXT NOT NULL DEFAULT '{}';
ALTER TABLE series      ADD COLUMN styles TEXT NOT NULL DEFAULT '{}';
ALTER TABLE exhibitions ADD COLUMN styles TEXT NOT NULL DEFAULT '{}';
ALTER TABLE cv_entries  ADD COLUMN styles TEXT NOT NULL DEFAULT '{}';
ALTER TABLE cv_groups   ADD COLUMN styles TEXT NOT NULL DEFAULT '{}';
