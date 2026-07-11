FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts \
  && pnpm rebuild @prisma/engines

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN DATABASE_URL="postgresql://build:build@db:5432/build" pnpm prisma generate && pnpm build \
  && pnpm exec tsc -p prisma/tsconfig.seed.json

FROM base AS runner
ENV NODE_ENV=production
COPY package.json prisma.config.ts docker-entrypoint.sh ./
COPY prisma ./prisma
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed
USER node
EXPOSE 4000
CMD ["sh", "docker-entrypoint.sh"]
