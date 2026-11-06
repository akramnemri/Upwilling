#!/bin/sh
# Container entry point. One image, and the process it starts depends on APP_ROLE (ADR-004, 01_ARCHITECTURE.md §5.3).
# `exec` replaces this shell so Node receives SIGTERM from `docker stop` directly.
set -eu

case "${APP_ROLE:-}" in
  worker)
    exec node --enable-source-maps /app/apps/web/dist/worker.cjs
    ;;
  *)
    # web, cms, or unset. Unset is only accepted locally: elsewhere the server refuses to start without a role.
    exec node /app/apps/web/server.js
    ;;
esac
