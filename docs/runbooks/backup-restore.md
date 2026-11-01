# Runbook — Database backups and restores (Task 1.6a) [HUMAN]

- Who: the supervisor, on the machine that serves as the server. Decision: ADR-026.
- What: every database of one stack is dumped once a day, encrypted, and kept 35 days. Any backup can be restored
  into **recette**, and only recette.
- Files: `infra/server/compose.backup.yaml`, `infra/server/backup/`, `infra/server/.env.backup.example`.
  Test: `infra/server/test/smoke-backup.sh`.
- **Test phase:** backups stay in a folder on this machine. That proves the process, but they would not survive
  losing the machine. **An off-site destination (§7) is mandatory before any real data.**

## How it works

1. Every 5 minutes the `backup` container looks at the destination. A database with no backup from the last 24 hours
   gets one, so a machine that was off at night catches up within minutes of Docker starting.
2. `pg_dump` is streamed through `age` to the destination: no plain dump ever touches a disk. The file appears under
   its final name, `<stack>-<database>-<UTC time>.dump.age`, only once it is complete.
3. After a fully successful round, that stack's backups older than 35 days are deleted. If a backup fails, nothing is.
4. The server only holds the **public** key: it can write backups, not read them. A restore needs the **private** key,
   which you keep elsewhere and mount only for that command.

## 1. The server folder and the key (once)

In PowerShell, from the repository folder, on an up-to-date `develop`:

```powershell
New-Item -ItemType Directory -Force C:\upwilling-server\backup\backup, C:\upwilling-server\backups
Copy-Item infra\server\compose.backup.yaml C:\upwilling-server\backup\
Copy-Item infra\server\.env.backup.example C:\upwilling-server\backup\.env
Copy-Item infra\server\backup\* C:\upwilling-server\backup\backup\
cd C:\upwilling-server\backup
docker compose -f compose.backup.yaml build
```

Generate the key, in a folder **outside** `C:\upwilling-server`:

```powershell
New-Item -ItemType Directory -Force $env:USERPROFILE\upwilling-backup-key
docker run --rm --entrypoint age-keygen -v "$env:USERPROFILE\upwilling-backup-key:/keys" upwilling-backup:local -o /keys/age-key.txt
```

It prints `Public key: age1…`.

- Put that public key in `C:\upwilling-server\backup\.env` (Notepad is fine): `BACKUP_AGE_RECIPIENT=age1…`. It is not a
  secret.
- **The private key is the file `age-key.txt`.** Copy its contents into your password manager. Without it, every
  backup is unreadable, for good. Never put it on the server, in `.env`, in the repository or in a chat.

## 2. Start

```powershell
cd C:\upwilling-server\backup
docker compose -f compose.backup.yaml up -d --wait
docker compose -f compose.backup.yaml logs --tail 20 backup
```

Expected: `started: recette, databases 'app' …`, `backing up app`, `backed up app as recette-app-….dump.age`, and a new
file in `C:\upwilling-server\backups`. The container restarts by itself with Docker.

## 3. Everyday operations

Commands in `C:\upwilling-server\backup`. Below, `<key>` stands for
`"$env:USERPROFILE\upwilling-backup-key\age-key.txt:/run/secrets/age-identity:ro"`.

| Task | Command |
|---|---|
| Is it healthy? | `docker compose -f compose.backup.yaml ps` |
| Log | `docker compose -f compose.backup.yaml logs --tail 50 backup` |
| Take a backup now | `docker compose -f compose.backup.yaml run --rm backup once` |
| List backups | `docker compose -f compose.backup.yaml run --rm restore list` |
| Update after the repository files changed | copy them again (§1), then `docker compose -f compose.backup.yaml up -d --build` |

`upwilling-backup` holds no data: `docker compose -f compose.backup.yaml down` is safe. Backups live in the folder.

## 4. Restore into recette

**This replaces recette's database.** Production can never be the target: the server has to say it is recette.

```powershell
cd C:\upwilling-server\backup
docker compose -f compose.backup.yaml run --rm restore list
docker compose -f compose.backup.yaml run --rm -v <key> restore check <backup name>
docker compose -f compose.backup.yaml run --rm -v <key> restore apply <backup name>
```

- `check` is the dry run: it decrypts the backup to its last byte and changes nothing.
- `apply` runs the same check, restores into a scratch database, then replaces the real one. Connections to recette's
  database are cut for an instant. If anything fails before that last step, recette stays exactly as it was.
- Expected last line: `restored <backup name> into app on recette`.
- Delete `age-key.txt` from the machine afterwards if it does not belong there: the password manager has it.

## 5. The restore proof (Essai 1, then every quarter)

Synthetic data only. No password needed: these commands use the container's local access.

```powershell
docker exec upwilling-recette-postgres-1 psql -U postgres -d app -c "CREATE TABLE restore_proof (id int, note text); INSERT INTO restore_proof VALUES (1, 'synthetic row')"
cd C:\upwilling-server\backup
docker compose -f compose.backup.yaml run --rm backup once
docker compose -f compose.backup.yaml run --rm restore list
docker exec upwilling-recette-postgres-1 psql -U postgres -d app -c "DROP TABLE restore_proof"
docker compose -f compose.backup.yaml run --rm -v <key> restore apply <newest backup name>
docker exec upwilling-recette-postgres-1 psql -U postgres -d app -c "SELECT * FROM restore_proof"
```

The last command must show the row. Then remove it: `DROP TABLE restore_proof`.

## 6. When something goes wrong

| What you see | Meaning | What to do |
|---|---|---|
| `unhealthy`, or `FAILED` in the log | No backup round has succeeded for an hour | Read the lines above it. It retries every 5 minutes, and old backups are not deleted meanwhile. |
| `password authentication failed` | The password in `<stack>/.env` no longer matches the database | Fix the stack's `.env`, then `up -d` here. |
| `network … not found` on start | The stack has never started, or was removed | Start the stack first. |
| `refused: this server reports cluster_name …` | The server is not recette, or runs a version from before this task | Do not work around it. On recette, wait for the deploy of this change. |
| `no identity matched any of the recipients` | The wrong private key | Use the key matching this backup's public key. |
| `age: error` on a right key | The file is damaged or incomplete | Take an older backup: `apply` has changed nothing. |

Backups do not alert anyone yet (ADR-026): look at `ps` from time to time until an alert exists.

## 7. Off-site destination and the real server

- **R2**: a human creates the account, the bucket and a token limited to it (`docs/integrations/r2.md`), then sets the
  listed variables in `backup/.env`, runs `up -d`, and checks §2 and §4. First real use: run the whole of §5.
- **Copying existing backups** is optional: they are ordinary files.
- **Linux server**: the folder must belong to the container's user, uid 999:
  `sudo install -d -o 999 -g 999 -m 700 /srv/backups`. Same for the key file during a restore.
- **Production**: `BACKUP_STACK=production` and `BACKUP_NETWORK=upwilling-prod_default`. Before the first restore of
  real data into recette, the PO decides whether and how that is allowed (ADR-026).
- **Updating Postgres**: change the digest in `compose.base.yaml` **and** `infra/server/backup/Dockerfile`, then copy
  and rebuild here. The smoke test fails if they differ.
