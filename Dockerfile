# syntax=docker/dockerfile:1

################# Base ##############
FROM node:22-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Pinned on purpose: `pnpm@latest` resolves at build time, and a new pnpm major
# can refuse the committed lockfile under --frozen-lockfile. Keep this equal to
# package.json's `packageManager` field, which is the pnpm that authored
# pnpm-lock.yaml.
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

################# Build deps (devDeps + deps) ##############
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# --ignore-scripts skips the root `prepare` (svelte-kit sync); the builder stage
# runs it as part of `pnpm build`. The cache mount keeps pnpm's
# content-addressable store between builds.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store && \
    pnpm install --frozen-lockfile --ignore-scripts

################# Production deps (prod-only) ##############
FROM base AS deps-prod

COPY package.json pnpm-lock.yaml ./

# --ignore-scripts again: the root `prepare` needs svelte-kit, a devDependency
# that --prod does not install.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store && \
    pnpm install --frozen-lockfile --prod --ignore-scripts

################# Builder ##############
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CI=true silences pnpm's interactive node_modules-purge prompt, which has no
# TTY to answer it in a build.
ENV CI=true

# Cache mounts persist Vite/SvelteKit intermediates across deploys, so a
# source-only change rebuilds incrementally.
RUN --mount=type=cache,id=vite,target=/app/node_modules/.vite \
    --mount=type=cache,id=sveltekit,target=/app/.svelte-kit \
    pnpm run build

################# Production ##############
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# adapter-node reads PORT; the reverse proxy in front maps the domain to it.
ENV PORT=3000
EXPOSE 3000

CMD ["node", "build"]
