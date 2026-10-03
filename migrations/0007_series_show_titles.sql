-- Whether a series names the works on its own page.
--
-- A series is often read as one piece, and a name under every picture breaks
-- that; off, the page is the pictures alone. It hides nothing: a work opened
-- from there still arrives with its name, its year and its whole caption, on
-- its own page as in the viewer. Series made before the choice existed go on
-- naming their works, which is what they have always done.

ALTER TABLE series ADD COLUMN show_titles INTEGER NOT NULL DEFAULT 1;
