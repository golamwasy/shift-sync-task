# Stage 1: Build the app
FROM node:20-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update && apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy root package.json and lockfile
COPY package.json pnpm-workspace.yaml ./

# Copy turbo and other root configs
COPY turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies
RUN pnpm install

# Build the server and its dependencies (shared)
RUN pnpm --filter @shift-sync/server... build

# Stage 2: Run the app
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

# We use corepack to ensure pnpm is available
RUN corepack enable

# Copy built artifacts and necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules

# Expose the listening port
EXPOSE 3000

# Start the Fastify server
CMD ["pnpm", "--filter", "@shift-sync/server", "start"]
