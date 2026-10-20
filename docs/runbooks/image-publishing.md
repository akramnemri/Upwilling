# Runbook — Published images (Task 1.5a)

- What: every push to `develop` or `main` whose CI passes publishes the app image to GitHub's container registry
  (GHCR). Servers (the local machine now, a VPS later) only ever run published images.
- Where it is defined: `.github/workflows/ci.yml`, jobs `publish` and `publish-manifest`; build script
  `infra/ci/build-and-check-image.sh`; `apps/web/Dockerfile`.
- Who does what: CI publishes. The supervisor makes the package public once (§2).

## 1. What gets published

| Tag | Content |
|---|---|
| `ghcr.io/akramnemri/upwilling-web:<commit SHA>` | **The one to deploy.** Multi-architecture: linux/amd64 + linux/arm64 |
| `…:<commit SHA>-amd64`, `…:<commit SHA>-arm64` | The two single-architecture builds the tag above points to. Do not delete them. |

- `<commit SHA>` is the full 40-character SHA of the commit on `develop`/`main`. The image serves it on
  `GET /api/version` (`{"version":"<SHA>"}`) and carries it in the `org.opencontainers.image.revision` label.
- Both architectures are built natively (GitHub's free `ubuntu-24.04` and `ubuntu-24.04-arm` runners), and each
  build is started once and must answer `/api/version` with its commit before it is pushed.
- Publishing waits for every other CI job (checks, secret scan, Docker smoke tests, shellcheck). A pull request
  builds and checks both architectures but publishes nothing.
- The repository is public, so the images are public: they never contain secrets (`.dockerignore`, Dockerfile).
  Configuration and secrets come from each server's `.env` at runtime.
- Images built by hand (`docker build` without `APP_VERSION`) report `"local"`.

## 2. Make the package public (supervisor, once)

GHCR creates the package as **private** on the first publish. Servers pull without credentials, so:

1. After the first push to `develop` that contains this workflow, wait for the `publish-manifest` job to pass.
2. GitHub → your profile → **Packages** → `upwilling-web` → **Package settings**.
3. "Danger Zone" → **Change visibility** → **Public**. Confirm with the package name.
4. Same page, "Manage Actions access": the `Upwilling` repository should be listed with the **Write** role (it is
   added automatically because the first push came from its workflow). Nothing else needs access.

Check from any machine, without logging in to GHCR:

```bash
docker buildx imagetools inspect ghcr.io/akramnemri/upwilling-web:<commit SHA>
```

The output lists two platforms, `linux/amd64` and `linux/arm64`.

## 3. Check an image by hand (optional)

```bash
docker run --rm -d --name version-check -p 127.0.0.1:3000:3000 -e DEPLOY_ENV=local ghcr.io/akramnemri/upwilling-web:<commit SHA>
curl -H "Host: upwilling.localhost" http://127.0.0.1:3000/api/version
docker rm -f version-check
```

## 4. Good to know

- A failed publish leaves nothing half-done for servers: the deployable tag `<commit SHA>` only exists once both
  architectures are pushed. Re-run the failed jobs from the Actions tab.
- GHCR storage is free for public packages. A retention rule (delete old untagged/unused versions) is not set up
  yet; it is not needed before many images accumulate.
- Deployments (moving `recette`/`production` to a published commit) come with Task 1.5b.
