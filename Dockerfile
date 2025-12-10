# Dockerfile for local BaaS Workers development with Miniflare
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy all packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose ports
# 8787 - Wrangler dev server
# 8788 - Wrangler inspector
EXPOSE 8787 8788

# Set environment
ENV NODE_ENV=development

# Default command: run the backend worker in dev mode
CMD ["pnpm", "dev"]
