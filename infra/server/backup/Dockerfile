# Backup and restore container (Task 1.6a, ADR-026). Built on the server by compose.backup.yaml, never published:
# it holds no secret, but nothing else needs it. Runbook: docs/runbooks/backup-restore.md

# rclone's own static binary: Debian trixie's package is 1.60, three years behind. Multi-arch digest.
FROM rclone/rclone:1.75.2@sha256:2687085f718d3c628f7fdfb77c52a1d344332aed543110bb88088f2c70d43eb5 AS rclone

# The database's own image and digest (compose.base.yaml): pg_dump refuses a server newer than itself.
# smoke-backup.sh fails if the two drift apart.
FROM postgres:18.6-trixie@sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336

# The trailing * accepts Debian's rebuild suffix (+bN), which can differ per architecture.
RUN apt-get update \
  && apt-get install -y --no-install-recommends 'age=1.2.1-1*' \
  && rm -rf /var/lib/apt/lists/*

COPY --from=rclone /usr/local/bin/rclone /usr/local/bin/rclone
COPY common.sh backup.sh restore.sh /usr/local/lib/upwilling-backup/

# Remotes are defined by RCLONE_CONFIG_* variables only: no config file, and HOME for what rclone caches.
ENV HOME=/tmp RCLONE_CONFIG=/dev/null

# The base image stops Postgres with SIGINT; this is a script.
STOPSIGNAL SIGTERM
USER postgres
ENTRYPOINT ["bash", "/usr/local/lib/upwilling-backup/backup.sh"]
