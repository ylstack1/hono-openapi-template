# 🚀 BaaS Workers - Backend-as-a-Service on Cloudflare

A modern, type-safe Backend-as-a-Service (BaaS) platform built on Cloudflare Workers, featuring manifest-driven development, strict TypeScript, and full API documentation.

## 📖 Overview

BaaS Workers is a monorepo-based backend platform that provides:

- **Manifest-Driven Architecture**: Define your data model, policies, and features in a single YAML file
- **Type-Safe Development**: Strict TypeScript with ESM modules across all packages
- **Cloudflare Workers**: Serverless, globally distributed, with D1, KV, R2, and Durable Objects support
- **OpenAPI-First**: Auto-generated API documentation with Scalar UI
- **Production Ready**: Built-in auth, logging, validation, and error handling

## 🏗️ Monorepo Structure

```
baas-workers/
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
│   ├── usecore/              # Core utilities & shared logic
│   ├── plugins/              # Plugin system (extensibility)
│   └── cli/                  # CLI tools for management
│
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

## 🗺️ Manifest-Driven Development

The `manifest.yaml` file is the heart of the platform. It defines:

### Feature Flags

```yaml
features:
  auth:
    enabled: true
    providers:
      - phone_password
  durableObjects:
    enabled: false
  storage:
    enabled: false
```

### Data Model (Entities)

```yaml
entities:
  - name: Store
    tableName: stores
    fields:
      - name: id
        type: uuid
        primary: true
      - name: name
        type: string
        required: true
    api:
      list: true
      get: true
      create: true
      update: true
      delete: true
    policies:
      list: "public"
      create: "authenticated"
      update: "owner"
```

### Access Policies

Policies control who can access what:

- `public`: Anyone (no authentication)
- `authenticated`: Any logged-in user
- `owner`: Only the resource owner
- `role:admin`: Only users with admin role
- Custom logic: Define reusable policy functions

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
}
```

### Adding Dependencies

```bash
# Add to specific package
pnpm --filter @baas-workers/backend add hono

# Add to root (devDependencies)
pnpm add -D -w typescript

# Add to all packages
pnpm -r add lodash
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9
```

### Database Migrations Failing

```bash
# Reset local database
pnpm --filter @baas-workers/backend db:reset:local

# Regenerate migrations
pnpm --filter @baas-workers/backend db:generate

# Apply again
pnpm migrate
```

### TypeScript Errors

```bash
# Clean build artifacts
find . -name ".tsbuildinfo" -delete
find . -name "dist" -type d -exec rm -rf {} +

# Reinstall dependencies
pnpm install
```

### Wrangler Login Issues

```bash
# Clear wrangler auth
pnpm wrangler logout

# Re-authenticate
pnpm wrangler login
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run checks: `pnpm lint && pnpm typecheck`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feat/my-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/baas-workers/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/baas-workers/discussions)
- **Discord**: [Join our community](#)

---

**Built with ❤️ using Cloudflare Workers, Hono, and TypeScript**
