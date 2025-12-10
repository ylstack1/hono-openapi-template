# BaaS Workers Monorepo Structure

This document describes the monorepo structure and provides a quick reference for developers.

## Directory Structure

```
baas-workers/                     # Root workspace
├── apps/                         # Application packages
│   └── backend/                  # Main Cloudflare Worker
│       ├── src/                  # Application source code
│       │   ├── api/              # API routes and middleware
│       │   │   ├── middlewares/  # Global middleware
│       │   │   └── routes/       # Feature-based routes
│       │   │       ├── auth/     # Authentication endpoints
│       │   │       ├── index/    # Root/health endpoints
│       │   │       └── records/  # Example CRUD endpoints
│       │   ├── config/           # Configuration & env parsing
│       │   ├── db/               # Drizzle ORM schemas & migrations
│       │   ├── lib/              # Shared utilities & factories
│       │   ├── types/            # TypeScript type definitions
│       │   ├── utils/            # Helper functions
│       │   └── app.ts            # Application entry point
│       ├── drizzle.config.ts     # Drizzle Kit configuration
│       ├── drizzle.local.config.ts # Local D1 config
│       ├── package.json          # Backend dependencies
│       ├── tsconfig.json         # Backend TypeScript config
│       ├── wrangler.toml         # Cloudflare Workers config
│       └── worker-configuration.d.ts # Cloudflare bindings types
│
├── packages/                     # Shared packages
│   ├── usecore/                  # Core utilities & shared logic
│   │   ├── src/
│   │   │   └── index.ts          # Placeholder implementation
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── plugins/                  # Plugin system (extensibility)
│   │   ├── src/
│   │   │   └── index.ts          # Placeholder implementation
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── cli/                      # CLI tools for management
│       ├── src/
│       │   └── index.ts          # Placeholder implementation
│       ├── package.json
│       └── tsconfig.json
│
├── .dockerignore                 # Docker ignore patterns
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore patterns
├── .prettierignore               # Prettier ignore patterns
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Container definition
├── eslint.config.mjs             # ESLint configuration
├── manifest.yaml                 # Data model & feature flags
├── package.json                  # Root workspace configuration
├── pnpm-workspace.yaml           # pnpm workspace definition
├── README.md                     # Main documentation
├── tsconfig.base.json            # Shared TypeScript configuration
└── MONOREPO_STRUCTURE.md         # This file
```

## Package Relationships

```
@baas-workers/backend
  ├── Dependencies: External packages (Hono, Drizzle, etc.)
  └── Dev Dependencies: wrangler, drizzle-kit

@baas-workers/usecore
  └── Dependencies: zod

@baas-workers/plugins
  └── Dependencies: @baas-workers/usecore (workspace)

@baas-workers/cli
  └── Dependencies: @baas-workers/usecore (workspace)
```

## Workspace Commands

### Development

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Run backend worker in development mode |
| `pnpm build`     | Build all packages                     |
| `pnpm typecheck` | Type check all packages                |

### Database

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm migrate`      | Run migrations locally       |
| `pnpm migrate:prod` | Run migrations on production |
| `pnpm seed`         | Seed local database          |

### Code Quality

| Command             | Description               |
| ------------------- | ------------------------- |
| `pnpm lint`         | Lint all packages         |
| `pnpm lint:fix`     | Fix linting issues        |
| `pnpm format`       | Format code with Prettier |
| `pnpm format:check` | Check code formatting     |

### Deployment

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `pnpm deploy:workers` | Deploy backend to Cloudflare |

## Backend-Specific Commands

Run from root with filter or from `apps/backend` directory:

```bash
# From root
pnpm --filter @baas-workers/backend <command>

# Or navigate to backend
cd apps/backend
pnpm <command>
```

### Available Backend Commands

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `pnpm dev`              | Start wrangler dev server        |
| `pnpm deploy`           | Deploy to Cloudflare Workers     |
| `pnpm cf-typegen`       | Generate TypeScript types        |
| `pnpm db:generate`      | Generate Drizzle migrations      |
| `pnpm db:migrate:local` | Apply migrations locally         |
| `pnpm db:migrate:prod`  | Apply migrations to production   |
| `pnpm db:inspect:local` | Inspect local database tables    |
| `pnpm db:seed:local`    | Seed local database              |
| `pnpm db:dump:local`    | Dump local database contents     |
| `pnpm db:studio`        | Open Drizzle Studio (production) |
| `pnpm db:studio:local`  | Open Drizzle Studio (local)      |
| `pnpm db:reset:local`   | Reset local database (⚠️ danger) |

## Key Configuration Files

### Root Level

- **`package.json`**: Workspace scripts and devDependencies
- **`pnpm-workspace.yaml`**: Defines `apps/*` and `packages/*` as workspace members
- **`tsconfig.base.json`**: Shared TypeScript config (strict mode, ESM)
- **`eslint.config.mjs`**: Linting rules for the entire workspace
- **`manifest.yaml`**: Data model definitions, policies, and feature flags
- **`.env.example`**: Template for environment variables

### Backend Package

- **`apps/backend/package.json`**: Backend dependencies and scripts
- **`apps/backend/tsconfig.json`**: Extends base config, adds Hono JSX support
- **`apps/backend/wrangler.toml`**: Cloudflare Workers configuration (D1, KV, R2, DO)
- **`apps/backend/drizzle.config.ts`**: Drizzle migrations configuration

### Shared Packages

- **`packages/*/package.json`**: Package metadata and dependencies
- **`packages/*/tsconfig.json`**: Extends base config, configured for libraries

## TypeScript Configuration

### Strict Mode Enabled

All packages use strict TypeScript with the following rules:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitOverride: true`
- `allowUnreachableCode: false`
- `allowUnusedLabels: false`
- `noPropertyAccessFromIndexSignature: true`
- `verbatimModuleSyntax: true`

### ESM Modules

- `module: "ESNext"`
- `moduleResolution: "Bundler"`
- `type: "module"` in all `package.json` files

## Manifest-Driven Development

The `manifest.yaml` file drives the platform architecture:

### Feature Flags

Control which platform features are enabled:

- `auth.enabled`: JWT authentication
- `durableObjects.enabled`: Durable Objects support
- `realtime.enabled`: Real-time subscriptions
- `storage.enabled`: R2 file storage
- `cron.enabled`: Scheduled jobs

### Entity Definitions

Define your data model declaratively:

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

- `public`: No authentication required
- `authenticated`: Requires valid JWT
- `owner`: Only resource owner
- `role:admin`: Admin users only
- Custom policy functions

## Docker Development

### Build and Run

```bash
# Build image
docker build -t baas-workers .

# Run with docker-compose
docker-compose up

# Run manually
docker run -p 8787:8787 -p 8788:8788 \
  -v $(pwd):/app \
  -v /app/node_modules \
  baas-workers
```

### Exposed Ports

- `8787`: Wrangler dev server
- `8788`: Wrangler inspector/debugger

## Adding New Packages

1. Create directory under `apps/` or `packages/`
2. Add `package.json` with `@baas-workers/<name>` scoped name
3. Add `tsconfig.json` that extends `../../tsconfig.base.json`
4. Add `src/index.ts` as entry point
5. Run `pnpm install` to link the package

## Workspace Dependencies

Reference other packages using workspace protocol:

```json
{
  "dependencies": {
    "@baas-workers/usecore": "workspace:*"
  }
}
```

## Environment Variables

### Local Development

Create `.dev.vars` in the backend directory:

```bash
cp .env.example apps/backend/.dev.vars
# Edit with your values
```

### Production

Set variables in Cloudflare dashboard:

1. Workers & Pages → Your Worker → Settings → Variables
2. Add environment variables (encrypted at rest)

## CI/CD

The repository includes pre-commit hooks via Husky:

- **Pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **Pre-push**: (Optional) Run tests

## Troubleshooting

### Workspace Not Recognized

```bash
pnpm install
```

### TypeScript Errors

```bash
find . -name ".tsbuildinfo" -delete
pnpm install
pnpm typecheck
```

### Port Already in Use

```bash
lsof -ti:8787 | xargs kill -9
```

### Database Issues

```bash
pnpm --filter @baas-workers/backend db:reset:local
pnpm --filter @baas-workers/backend db:generate
pnpm migrate
```

## Next Steps

1. **Configure Environment**: Copy `.env.example` to `apps/backend/.dev.vars` and set values
2. **Initialize Database**: Run `pnpm migrate` to set up the local database
3. **Start Development**: Run `pnpm dev` to start the backend worker
4. **Explore API**: Visit http://localhost:8787/docs for interactive API documentation
5. **Customize Manifest**: Edit `manifest.yaml` to define your data model
6. **Add Features**: Create new routes in `apps/backend/src/api/routes/`

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

For more information, see the main [README.md](README.md).
