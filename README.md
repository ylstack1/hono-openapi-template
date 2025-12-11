# 🚀 BaaS Workers - Backend-as-a-Service on Cloudflare

A modern, type-safe Backend-as-a-Service (BaaS) platform built on Cloudflare Workers, featuring manifest-driven development, strict TypeScript, and full API documentation.

## 📖 Overview

BaaS Workers is a monorepo-based backend platform that provides:

- **Manifest-Driven Architecture**: Define your data model, policies, and features in a single YAML file
- **Type-Safe Development**: Strict TypeScript with ESM modules across all packages
- **Cloudflare Workers**: Serverless, globally distributed, with D1, KV, R2, and Durable Objects support
- **OpenAPI-First**: Auto-generated API documentation with Scalar UI
- **Production Ready**: Built-in auth, logging, validation, and error handling

## 🎯 Quick Start: Starter Template

**Want to build your own app?** Check out the [starter-app template](./starter-app/):

```bash
cd starter-app
pnpm install
pnpm dev
```

Edit `config.ts` → Get a full backend with API + docs + migrations. That's it!

See [starter-app/README.md](./starter-app/README.md) for details.

## 🏗️ Monorepo Structure

```
baas-workers/
├── starter-app/              # 🎯 Starter template (start here!)
│   ├── config.ts            # Single config file = full backend
│   ├── src/                 # Application code
│   ├── package.json         # Just 2 deps: usecore + admin
│   └── README.md            # Quick start guide
│
├── apps/
│   └── backend/              # Main Cloudflare Worker application
│       ├── src/              # Source code
│       │   ├── api/          # API routes (auth, records, etc.)
│       │   ├── config/       # Configuration & environment
│       │   ├── db/           # Drizzle ORM schema & migrations
│       │   ├── lib/          # Shared utilities
│       │   ├── types/        # TypeScript types
│       │   └── app.ts        # Application entry point
│       ├── wrangler.toml     # Cloudflare Workers config
│       ├── drizzle.config.ts # Database migrations config
│       └── package.json
│
├── packages/
│   ├── usecore/              # Core utilities & backend factory
│   ├── admin/                # React admin UI
│   ├── plugins/              # Plugin system (extensibility)
│   └── cli/                  # CLI tools for management
│
├── examples/                 # Production-ready manifest examples
├── manifest.yaml             # Data model, policies, features
├── tsconfig.base.json        # Shared TypeScript config
├── pnpm-workspace.yaml       # pnpm workspace definition
├── Dockerfile                # Local development with Miniflare
├── .env.example              # Environment variables template
└── package.json              # Root workspace scripts
```

## ⚙️ Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v8 or higher
- **Cloudflare Account**: For deployment (free tier available)
- **Docker**: (Optional) For containerized development

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd baas-workers

# Install dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy the environment template
cp .env.example .dev.vars

# Edit .dev.vars and set:
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - CLOUDFLARE_ACCOUNT_ID (from Cloudflare dashboard)
# - Other variables as needed
```

### 3. Initialize Database

```bash
# Generate Drizzle migrations from schema
pnpm --filter @baas-workers/backend db:generate

# Run migrations locally
pnpm migrate

# (Optional) Seed with sample data
pnpm seed
```

### 4. Start Development Server

```bash
# Run backend worker with hot reload
pnpm dev

# The API will be available at:
# - http://localhost:8787
# - API docs: http://localhost:8787/docs
# - OpenAPI spec: http://localhost:8787/openapi.json
```

## 🌟 Quick Start with Examples

We provide several production-ready manifest configurations in the `examples/` directory.

To use an example:

1.  Browse `examples/` to find a configuration that matches your use case (e.g., E-commerce, CMS, SaaS).
2.  Copy the content to your project's `manifest.yaml`.
3.  Update your `apps/backend/src/config/manifest.ts` to load this configuration (if not using dynamic loading).
4.  Run migrations to create the new tables.

**Available Examples:**

- **CMS**: `examples/manifest.cms.yaml`
- **E-commerce**: `examples/manifest.ecommerce.yaml`
- **SaaS Platform**: `examples/manifest.saas.yaml`
- **Social Network**: `examples/manifest.social.yaml`
- **Minimal**: `examples/manifest.minimal.yaml`

See [examples/README.md](examples/README.md) for more details.

## 📦 Available Commands

### Root Workspace Commands

```bash
# Development
pnpm dev                    # Run backend worker in dev mode
pnpm build                  # Build all packages

# Database
pnpm migrate                # Run migrations (local)
pnpm migrate:prod           # Run migrations (production)
pnpm seed                   # Seed database with sample data

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Fix linting issues
pnpm format                 # Format code with Prettier
pnpm format:check           # Check code formatting
pnpm typecheck              # Type check all packages

# Deployment
pnpm deploy:workers         # Deploy backend to Cloudflare
```

### Backend-Specific Commands

```bash
# Run from root with filter
pnpm --filter @baas-workers/backend <command>

# Or navigate to apps/backend
cd apps/backend

# Development
pnpm dev                    # Start wrangler dev server

# Database
pnpm db:generate            # Generate migrations
pnpm db:migrate:local       # Apply migrations locally
pnpm db:migrate:prod        # Apply migrations to production
pnpm db:inspect:local       # Inspect local database tables
pnpm db:seed:local          # Seed local database
pnpm db:dump:local          # Dump local database contents
pnpm db:studio              # Open Drizzle Studio (production)
pnpm db:studio:local        # Open Drizzle Studio (local)
pnpm db:reset:local         # Reset local database (⚠️ destructive)

# Deployment
pnpm deploy                 # Deploy to Cloudflare Workers
pnpm cf-typegen             # Generate TypeScript types for bindings
```

## 🐳 Docker Development

Run the entire platform in a container:

```bash
# Build the Docker image
docker build -t baas-workers .

# Run with volume mounting for live reload
docker run -p 8787:8787 -p 8788:8788 \
  -v $(pwd):/app \
  -v /app/node_modules \
  baas-workers

# Or use docker-compose (create docker-compose.yml)
docker-compose up
```

## 🗺️ Manifest Configuration Guide

The `manifest.yaml` file is the heart of the platform. It defines your data model, access policies, and enabled features.

### Feature Flags

```yaml
features:
  auth:
    enabled: true
    providers: ["phone_password", "email_password"]
  durableObjects:
    enabled: false
  storage:
    enabled: true # Enable R2 storage
  cron:
    enabled: true # Enable scheduled tasks
```

### Data Model (Entities)

Define your database schema using entities.

```yaml
entities:
  - name: Store
    tableName: stores
    fields:
      - name: id
        type: uuid
        primary: true
        generated: true
      - name: name
        type: string
        required: true
        maxLength: 255
      - name: ownerId
        type: uuid
        required: true
        references: "User.id" # Foreign key
    policies:
      list: "public"
      create: "authenticated"
      update: "owner"
      delete: "owner"
```

### Access Policies

Policies control who can access what:

- `public`: Anyone (no authentication required)
- `authenticated`: Any logged-in user
- `owner`: Only the resource owner (checks `ownerId` field)
- `role:admin`: Only users with 'admin' role
- `member`: Custom policy (e.g., workspace member)

## 🚢 Deployment Checklist

Before deploying to production, ensure you have completed the following:

1.  **Type Check & Build**

    ```bash
    pnpm typecheck
    pnpm build
    ```

    Ensure there are no TypeScript errors and the build succeeds.

2.  **Environment Variables**
    Set production secrets in Cloudflare Dashboard or via Wrangler:

    ```bash
    wrangler secret put JWT_SECRET
    ```

3.  **Database Migration**
    Apply your schema to the production D1 database:

    ```bash
    pnpm migrate:prod
    ```

4.  **Security Audit**
    - [ ] Verify `JWT_SECRET` is strong and not committed to git.
    - [ ] Ensure all sensitive entities have proper RBAC policies.
    - [ ] Check that SQL queries use parameterized inputs (handled by Drizzle).

5.  **Deploy**
    ```bash
    pnpm deploy:workers
    ```

## 🔑 Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable                | Description        | Example                   |
| ----------------------- | ------------------ | ------------------------- |
| `NODE_ENV`              | Environment        | `development`             |
| `JWT_SECRET`            | JWT signing key    | Generate with crypto      |
| `LOG_LEVEL`             | Logging verbosity  | `debug`, `info`, `error`  |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | From dashboard            |
| `CLOUDFLARE_API_TOKEN`  | API token          | From dashboard            |
| `D1_DATABASE_ID`        | D1 database ID     | Auto-set in wrangler.toml |

### Local Development Variables

For local development, create `.dev.vars` in the backend directory:

```bash
# apps/backend/.dev.vars
JWT_SECRET=your-secret-here
LOG_LEVEL=debug
```

### Production Variables

Set production variables in the Cloudflare dashboard:

1. Workers & Pages → Your Worker → Settings → Variables
2. Add each variable (they're encrypted at rest)

## 🔐 Authentication

Built-in JWT authentication with phone/password:

```bash
# Register a user
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","phoneNumber":"1234567890","password":"secret123"}'

# Login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"1234567890","password":"secret123"}'

# Returns:
# {
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ..."
# }

# Use access token in subsequent requests
curl -X GET http://localhost:8787/auth/me \
  -H "Authorization: Bearer eyJ..."
```

## 📊 Database Management

### Drizzle ORM

The backend uses Drizzle ORM with Cloudflare D1:

```typescript
// apps/backend/src/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
});
```

### Migrations Workflow

```bash
# 1. Modify schema in src/db/schema.ts
# 2. Generate migration
pnpm --filter @baas-workers/backend db:generate

# 3. Review migration in src/db/migrations/
# 4. Apply locally
pnpm migrate

# 5. Test your changes
pnpm dev

# 6. Apply to production
pnpm migrate:prod
```

### Database Bindings

D1 is bound via `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "demo"
database_id = "your-database-id"
migrations_dir = "./src/db/migrations"
```

Access in code:

```typescript
// Injected via middleware
app.use("*", async (c, next) => {
  c.set("db", drizzle(c.env.DB));
  await next();
});

// Use in routes
const db = c.get("db");
const users = await db.select().from(usersTable);
```

## 🧪 Testing

```bash
# Run tests (when configured)
pnpm test

# Type checking (runs across all packages)
pnpm typecheck

# Linting
pnpm lint
```

## 🚢 Deployment

### Deploying to Cloudflare Workers

```bash
# 1. Login to Cloudflare
pnpm wrangler login

# 2. Create D1 database (first time only)
pnpm wrangler d1 create demo

# 3. Update wrangler.toml with database_id
# Copy the database_id from the previous command

# 4. Run migrations on production
pnpm migrate:prod

# 5. Deploy worker
pnpm deploy:workers

# Your API is now live at:
# https://baas-backend.<your-subdomain>.workers.dev
```

### CI/CD

The repository includes GitHub Actions/GitLab CI configuration:

- Runs linting, type checking, and tests on every push
- Deploys to production on merge to main
- Requires `CLOUDFLARE_API_TOKEN` secret

## 📚 API Documentation

### Accessing Docs

- **Scalar UI**: http://localhost:8787/docs (interactive)
- **OpenAPI JSON**: http://localhost:8787/openapi.json

### API Structure

```
/                           # API metadata
/docs                       # Interactive API docs
/openapi.json               # OpenAPI 3.0 spec

/auth/*                     # Authentication endpoints
  POST   /auth/login
  POST   /auth/refresh
  GET    /auth/me

/records/*                  # Example CRUD endpoints
  GET    /records
  POST   /records
  GET    /records/:id
  PATCH  /records/:id
  DELETE /records/:id
```

### Adding New Endpoints

1. Create route file in `apps/backend/src/api/routes/`
2. Define OpenAPI schema with `@hono/zod-openapi`
3. Implement handler and service layer
4. Register in `apps/backend/src/app.ts`

Example:

```typescript
// apps/backend/src/api/routes/stores.ts
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

const listStoresRoute = createRoute({
  method: "get",
  path: "/stores",
  tags: ["Stores"],
  summary: "List all stores",
  responses: {
    200: {
      description: "List of stores",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
            }),
          ),
        },
      },
    },
  },
});
```

## 🔧 Configuration

### TypeScript Configuration

- **Base Config**: `tsconfig.base.json` - Shared strict settings
- **Per-Package Config**: Each package extends the base config
- **Strict Mode**: Enabled workspace-wide with ESM modules

### ESLint & Prettier

- **ESLint**: Configured in `eslint.config.mjs`
  - TypeScript rules
  - Perfectionist (sorting)
  - Unicorn (best practices)
- **Prettier**: Standard formatting
- **Husky**: Pre-commit hooks for linting/formatting

### Git Hooks

```bash
# Installed via husky
.husky/pre-commit          # Runs lint-staged
.husky/pre-push            # (Optional) Runs tests
```

## 📦 Package Management

### Workspace Dependencies

Link workspace packages:

```json
{
  "dependencies": {
    "@baas-workers/usecore": "workspace:*"
  }
  // ...
}
```
