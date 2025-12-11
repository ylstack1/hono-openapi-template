# Architecture Overview

This document explains the architecture of the baas-workers starter app and how it implements the "config → full app" pattern.

## Core Concept

```
config.ts (data model)
    ↓
@baas-workers/usecore (backend factory)
    ↓
Full Hono API with auto-generated routes
```

**Key insight**: The backend IS usecore + config. No separate backend package needed.

## Components

### 1. Configuration (`config.ts`)

The single source of truth for your entire backend. Defines:

- **Metadata**: App name, version, description
- **Features**: Auth, storage, etc.
- **Entities**: Data models with fields and validation
- **Policies**: Access control rules

```typescript
const config: Manifest = {
  metadata: { name: "My App", version: "1.0.0" },
  entities: [
    {
      name: "Product",
      fields: [
        { name: "id", type: "uuid", primary: true },
        { name: "name", type: "string", required: true },
      ],
      policies: {
        list: "public",
        create: "authenticated",
      },
    },
  ],
};
```

### 2. Config Loader (`src/config-loader.ts`)

Auto-detects and loads config from multiple sources:

1. `config.ts` - TypeScript (primary)
2. `manifest.yaml` - YAML
3. `manifest.json` - JSON
4. `config.json` - JSON

Also validates config structure before app starts.

### 3. Database Setup (`src/db-setup.ts`)

Handles database initialization:

1. Checks if migrations exist
2. If not, generates SQL from config using `generateMigrations()`
3. Writes migration files to `migrations/`
4. Applies migrations to local SQLite (for dev)

For production (Cloudflare Workers), migrations are applied via `wrangler d1 migrations apply`.

### 4. Application (`src/app.ts`)

Creates the Hono app using usecore:

```typescript
export function createApp(config: Manifest): Hono {
  const app = new Hono()

  // API routes (auto-generated from config)
  const apiRouter = createManifestRouter(config)
  app.route('/api', apiRouter)

  // OpenAPI spec (auto-generated)
  const openapi = generateOpenAPI(config)
  app.get('/openapi.json', (c) => c.json(openapi))

  // Docs (Swagger UI)
  app.get('/docs', (c) => { ... })

  return app
}
```

### 5. Entry Point (`src/index.ts`)

Orchestrates the startup sequence:

1. Load config
2. Validate config
3. Setup database
4. Create app
5. Start server

## Auto-Generated Features

### REST API

For each entity, the following endpoints are auto-generated:

```
GET    /api/{entity}       - List entities
POST   /api/{entity}       - Create entity
GET    /api/{entity}/:id   - Get entity by ID
PATCH  /api/{entity}/:id   - Update entity
DELETE /api/{entity}/:id   - Delete entity
```

### Validation

Zod schemas are auto-generated from entity field definitions:

- Type validation (string, number, boolean, etc.)
- Required/optional fields
- Min/max constraints
- Pattern matching (email, URL, etc.)
- Enum values

### Database Schema

SQL migrations are auto-generated:

- CREATE TABLE statements
- Column types mapped from entity fields
- Primary keys, unique constraints
- Indexes for foreign keys and unique fields
- Default values

### OpenAPI Specification

Complete OpenAPI 3.0 spec is auto-generated:

- All endpoints documented
- Request/response schemas
- Path parameters
- Query parameters
- Validation rules

## Data Flow

### Create Entity Flow

```
1. Client sends POST /api/products
   ↓
2. Router extracts body
   ↓
3. Validator validates against entity schema
   ↓
4. If valid, TODO: D1 client inserts into database
   ↓
5. Response with created entity
```

### List Entities Flow

```
1. Client sends GET /api/products?limit=10
   ↓
2. Router extracts query params
   ↓
3. Validator validates filter schema
   ↓
4. TODO: D1 client queries database
   ↓
5. Response with array of entities + metadata
```

## Extension Points

### Custom Routes

Add custom routes in `src/app.ts`:

```typescript
app.get("/custom", (c) => {
  return c.json({ message: "Custom endpoint" });
});
```

### Custom Middleware

Add middleware before routes:

```typescript
app.use(async (c, next) => {
  console.log("Custom middleware");
  await next();
});
```

### Custom Validation

Extend entity validators:

```typescript
const validator = new EntityValidator(entity);
validator.buildCreateSchema(); // Customize this
```

## Environment-Specific Behavior

### Development (Node.js)

- Uses local SQLite database
- Auto-applies migrations
- File storage in local directory
- Hot reload with `tsx watch`

### Production (Cloudflare Workers)

- Uses Cloudflare D1 (SQLite)
- Migrations applied via `wrangler`
- R2 for file storage
- KV for sessions
- Edge deployment

## Security Considerations

### Policy Evaluation

Access control is enforced via policies:

- `public` - Anyone can access
- `authenticated` - Must be logged in
- `owner` - Must own the resource
- `role:admin` - Must have specific role

Policies support logical operators:

- `owner || role:admin` - Owner OR admin
- `authenticated && role:manager` - Authenticated AND manager

### JWT Authentication

When auth is enabled:

- JWT tokens for authentication
- Token verification on protected routes
- Role-based access control
- Owner checks for resource updates

## Performance

### Database

- SQLite for local dev (single file)
- D1 for production (distributed SQLite)
- Indexes auto-created for foreign keys
- Query optimization TODO

### Caching

- TODO: Response caching with KV
- TODO: Query result caching
- TODO: Static asset caching

## Monitoring

### Logging

- Request logging via Hono logger
- Error logging
- Performance metrics TODO

### Health Checks

- `/health` endpoint
- Returns app status, name, version

## Future Enhancements

### Planned Features

- [ ] Real-time subscriptions
- [ ] File upload/download
- [ ] Email notifications
- [ ] Scheduled tasks
- [ ] Webhooks
- [ ] Rate limiting
- [ ] API versioning

### Integration Points

- Admin UI via `@baas-workers/admin`
- GraphQL via `@baas-workers/graphql` (future)
- WebSocket support (future)

## Related Documentation

- [README.md](README.md) - Quick start guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [@baas-workers/usecore](../../packages/usecore/README.md) - Core package docs
