-- A show gets a page of its own, so it needs an address of its own.
--
-- The note under a show on the exhibitions page can run long. It is cut
-- short there with a link onto the show's own page, where the whole of it is
-- read -- so every show needs a slug the way a work and a series already do.
--
-- Every row starts out addressed by its id, which can never clash and can
-- never carry a character an address may not. The readable name is written
-- over it by the next migration.

ALTER TABLE exhibitions ADD COLUMN slug TEXT NOT NULL DEFAULT '';

UPDATE exhibitions
SET slug = 'sergi-' || replace(lower(id), '_', '-')
WHERE slug = '';

CREATE UNIQUE INDEX exhibitions_by_slug ON exhibitions (slug);
