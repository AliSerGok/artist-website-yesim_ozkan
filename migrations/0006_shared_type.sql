-- One face per kind of row, not one per row.
--
-- Every work on the site is now written the same way, and so is every series,
-- every show and every line of the participation list -- the way the home page
-- has always set every slide alike. The choice moves out of the rows and into
-- a row of this table, one per kind, holding `{"styles": {...}}` exactly as
-- the home page's row does. See src/lib/page-type.ts. The about page is the
-- exception and goes on keeping a face per block.
--
-- Whatever was already chosen is carried over rather than dropped: the first
-- row that had been given a face of its own becomes the face of its whole
-- kind. Nothing had been chosen, nothing is written, and the kind starts in
-- the face the site has always set it in.

INSERT INTO pages (key, data)
SELECT 'works', json_object('styles', json(styles))
FROM works
WHERE styles IS NOT NULL AND styles != '{}'
ORDER BY sort_order
LIMIT 1;

INSERT INTO pages (key, data)
SELECT 'series', json_object('styles', json(styles))
FROM series
WHERE styles IS NOT NULL AND styles != '{}'
ORDER BY sort_order
LIMIT 1;

INSERT INTO pages (key, data)
SELECT 'exhibitions', json_object('styles', json(styles))
FROM exhibitions
WHERE styles IS NOT NULL AND styles != '{}'
ORDER BY sort_order
LIMIT 1;

-- The list keeps two faces: one for its headings, one for the lines under
-- them. Each was stored per row under "title".
INSERT INTO pages (key, data)
SELECT 'cv', json_object('styles', json_object(
  'group', json((SELECT json_extract(styles, '$.title') FROM cv_groups
                 WHERE styles IS NOT NULL AND styles != '{}'
                 ORDER BY sort_order LIMIT 1)),
  'entry', json((SELECT json_extract(styles, '$.title') FROM cv_entries
                 WHERE styles IS NOT NULL AND styles != '{}'
                 ORDER BY sort_order LIMIT 1))
))
WHERE EXISTS (SELECT 1 FROM cv_groups WHERE styles IS NOT NULL AND styles != '{}')
   OR EXISTS (SELECT 1 FROM cv_entries WHERE styles IS NOT NULL AND styles != '{}');

-- The contact rows were the one list on a page that chose a face per row; the
-- first row's becomes the face of the whole list.
UPDATE pages
SET data = json_set(data, '$.styles.row', json_extract(data, '$.rows[0].style'))
WHERE key = 'contact'
  AND json_extract(data, '$.rows[0].style') IS NOT NULL;

-- Nothing reads these any more.
ALTER TABLE works       DROP COLUMN styles;
ALTER TABLE series      DROP COLUMN styles;
ALTER TABLE exhibitions DROP COLUMN styles;
ALTER TABLE cv_entries  DROP COLUMN styles;
ALTER TABLE cv_groups   DROP COLUMN styles;
