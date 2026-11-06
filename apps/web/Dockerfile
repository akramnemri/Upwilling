# syntax=docker/dockerfile:1
#
# Production image for apps/web. One image, several container roles (ADR-004, 01_ARCHITECTURE.md §5):
# APP_ROLE=web (+ SITE), cms or worker, chosen at runtime by docker/entrypoint.sh.
#
# Build from the repository root (the build context must contain the whole workspace):
#   docker build -f apps/web/Dockerfile -t upwilling-web:local .
# The repository and the image are public: never copy or pass secrets here. Runtime configuration
# comes from environment variables only. Runbook: docs/runbooks/local-container-roles.md

# Node 24 LTS on Debian 13 slim, pinned by the digest of the multi-arch index (ADR-018).
ARG NODE_IMAGE=node:24.22.0-trixie-slim@sha256:7f486cabe892bff8fef04c0f7da8dba84a560be3e4e2740b7a86afc57ebec315

# ---------------------------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
# pnpm at the exact version of package.json "packageManager".
RUN corepack enable pnpm

WORKDIR /repo

# Manifests first: the dependency layer is only rebuilt when one of them changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/design-system/package.json packages/design-system/
RUN --mount=type=cache,id=upwilling-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

COPY . .
# next build (standalone output) + esbuild bundles of the worker and the healthcheck.
RUN pnpm --filter @upwilling/web build

# ---------------------------------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime

LABEL org.opencontainers.image.source="https://github.com/akramnemri/Upwilling" \
      org.opencontainers.image.description="UpWilling web platform (web, cms and worker roles)"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
# Docker sets HOSTNAME to the container ID, and the standalone server binds to HOSTNAME: listen on all interfaces.
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Everything stays owned by root: the `node` user can read and run the app but not modify it.
COPY --from=build /repo/apps/web/.next/standalone ./
# Next.js leaves client assets out of the standalone folder (it expects a CDN); server.js serves them from here.
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/dist ./apps/web/dist
# Static files (brand logos, favicons, Open Graph images): also left out of standalone, served by server.js.
COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --chmod=755 apps/web/docker/entrypoint.sh /usr/local/bin/upwilling-entrypoint

# Next.js writes its data cache here at runtime: the one writable app path (compose mounts a tmpfs on it).
RUN mkdir -p apps/web/.next/cache && chown node:node apps/web/.next/cache

# The commit this image was built from, set by the publish workflow (Task 1.5) and served by /api/version.
# Hand-made builds stay "local". Declared last so a new commit does not invalidate the layers above.
ARG APP_VERSION=local
ENV APP_VERSION=${APP_VERSION}
LABEL org.opencontainers.image.revision=${APP_VERSION}

USER node
EXPOSE 3000

# Liveness only (/api/health for web and cms, the heartbeat file for the worker); see src/lib/container-health.ts.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["node", "/app/apps/web/dist/healthcheck.cjs"]

ENTRYPOINT ["/usr/local/bin/upwilling-entrypoint"]
