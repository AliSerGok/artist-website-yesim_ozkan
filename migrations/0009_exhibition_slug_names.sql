-- The readable half of a show's address.
--
-- Written over the id-based slug the previous migration handed out: the
-- Turkish letters folded to ASCII, everything that is not a letter or a
-- digit turned into a dash -- the same name src/lib/slug.ts would write.
--
-- The folding is done twice over, because the same letter reaches the
-- database two ways: "u" with an umlaut may be one character, or it may be a
-- plain "u" with a combining mark after it, which is how text typed on a Mac
-- arrives. The first pass catches the single character, the second strips
-- the marks.
--
-- It is done a few replacements at a time in a table of its own rather than
-- in one expression, because D1 refuses an expression nested deeper than a
-- hundred calls -- and in its own table rather than in the slug column,
-- because two shows may pass through the same half-finished name and the
-- column will not hold the same address twice.

CREATE TABLE _slug (id TEXT PRIMARY KEY, v TEXT NOT NULL);

INSERT INTO _slug (id, v)
SELECT id, title_tr FROM exhibitions WHERE slug LIKE 'sergi-%';

UPDATE _slug SET v = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(v, 'ç', 'c'), 'Ç', 'c'), 'ğ', 'g'), 'Ğ', 'g'), 'ı', 'i'), 'İ', 'i'), 'ö', 'o'), 'Ö', 'o'), 'ş', 's'), 'Ş', 's'), 'ü', 'u');
UPDATE _slug SET v = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(v, 'Ü', 'u'), 'â', 'a'), 'Â', 'a'), 'î', 'i'), 'Î', 'i'), 'û', 'u'), 'Û', 'u'), 'é', 'e'), 'É', 'e'), 'ê', 'e'), 'ñ', 'n');
UPDATE _slug SET v = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(v, char(768), ''), char(769), ''), char(770), ''), char(771), ''), char(772), ''), char(774), ''), char(775), ''), char(776), ''), char(778), ''), char(779), ''), char(780), ''), char(807), ''), char(808), '');
UPDATE _slug SET v = lower(v);
UPDATE _slug SET v = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(v, ' ', '-'), '.', '-'), ',', '-'), ':', '-'), '/', '-'), '\', '-'), '(', '-'), ')', '-'), '[', '-'), ']', '-'), '{', '-'), '}', '-');
UPDATE _slug SET v = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(v, '"', '-'), '''', '-'), '’', '-'), '‘', '-'), '“', '-'), '”', '-'), '—', '-'), '–', '-'), '_', '-'), '&', '-'), '!', '-'), '?', '-');
UPDATE _slug SET v = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(v, '#', '-'), '+', '-'), '%', '-'), '*', '-'), '=', '-'), '@', '-'), '|', '-'), '<', '-'), '>', '-'), '~', '-'), '^', '-'), '$', '-');
UPDATE _slug SET v = replace(v, char(59), '-');
UPDATE _slug SET v = replace(replace(replace(replace(replace(v, char(45) || char(45), '-'), char(45) || char(45), '-'), char(45) || char(45), '-'), char(45) || char(45), '-'), char(45) || char(45), '-');
UPDATE _slug SET v = trim(v, '-');

-- Taken only where it is a whole, clean address nothing else has claimed;
-- anything else keeps the id it already carries.
UPDATE exhibitions
SET slug = (SELECT v FROM _slug WHERE _slug.id = exhibitions.id)
WHERE slug LIKE 'sergi-%'
  AND EXISTS (
    SELECT 1 FROM _slug
    WHERE _slug.id = exhibitions.id
      AND _slug.v <> ''
      AND _slug.v NOT GLOB '*[^a-z0-9-]*'
      AND NOT EXISTS (
        SELECT 1 FROM exhibitions other
        WHERE other.id <> exhibitions.id AND other.slug = _slug.v
      )
      -- Two shows of the same name: the first takes it, the rest keep the
      -- id they already carry. Re-saving one in the panel gives it a
      -- numbered name, the way a work of a repeated name gets one.
      AND NOT EXISTS (
        SELECT 1 FROM _slug earlier
        WHERE earlier.v = _slug.v AND earlier.id < _slug.id
      )
  );

DROP TABLE _slug;
