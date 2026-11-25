-- Runs once, when the local volume is created (the image's /docker-entrypoint-initdb.d).
-- `app` is for `pnpm dev`; `app_test` is emptied and rebuilt by the integration tests, so running them
-- never touches your local content.
CREATE DATABASE app_test OWNER app;
