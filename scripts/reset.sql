-- Empties the database in place so a reset does not need the dev server
-- stopped. Deleting the .wrangler state files instead leaves any running
-- server holding a handle to a file that no longer exists.
DROP TABLE IF EXISTS works;
DROP TABLE IF EXISTS series;
DROP TABLE IF EXISTS exhibitions;
DROP TABLE IF EXISTS cv_entries;
DROP TABLE IF EXISTS cv_groups;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS d1_migrations;
