# baas-workers Starter App

Complete starter template for baas-workers. **One config file = full app** with API + Admin UI.

## 🎯 The Core Pattern

```
config.ts (your data model)
    ↓
@baas-workers/usecore → createManifestRouter(config)
    ↓
Full Hono app with:
  - Auto-generated REST API
  - OpenAPI documentation
  - Database migrations
  - Type-safe validation
```

**That's it. No separate backend package needed.**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Your App

Edit `config.ts` to define your data model:

```typescript
import type { Manifest } from "@baas-workers/usecore";

const config: Manifest = {
  metadata: {
    name: "My App",
    version: "1.0.0",
  },
  entities: [
    {
      name: "Product",
      tableName: "products",
      fields: [
        { name: "id", type: "uuid", primary: true, generated: true },
        { name: "name", type: "string", required: true },
        { name: "price", type: "decimal", required: true },
        // ... more fields
      ],
      policies: {
        list: "public",
        create: "authenticated",
      },
    },
  ],
};
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access Your App

- **Home**: http://localhost:3000/
- **API**: http://localhost:3000/api
- **Docs**: http://localhost:3000/docs (Interactive Swagger UI)
- **Admin**: http://localhost:3000/admin
- **OpenAPI**: http://localhost:3000/openapi.json

## 📁 Project Structure

```
starter-app/
├── config.ts              # 📝 Your entire backend config
├── src/
│   ├── app.ts            # Creates Hono app using usecore
│   ├── index.ts          # Entry point
│   ├── config-loader.ts  # Auto-detects config files
│   └── db-setup.ts       # Auto-migration
├── package.json          # Just 2 dependencies: usecore + admin
└── migrations/           # Auto-generated SQL (created on first run)
```

## 🎨 What You Get

### ✅ Auto-Generated API

Define entities in `config.ts`, get full REST API:

```
GET    /api/products        - List products
POST   /api/products        - Create product
GET    /api/products/:id    - Get product
PATCH  /api/products/:id    - Update product
DELETE /api/products/:id    - Delete product
```

### ✅ OpenAPI Documentation

Visit `/docs` for interactive Swagger UI with:

- All endpoints documented
- Request/response schemas
- Try-it-out functionality
- Auto-generated from your config

### ✅ Database Migrations

On first run, automatically:

1. Generates SQL from config
2. Creates `migrations/` directory
3. Applies migrations to local SQLite
4. Tracks migration history

### ✅ Type Safety

Full TypeScript support:

- Config types from usecore
- Validation with Zod
- Type-safe API handlers
- IDE autocomplete

### ✅ Authentication Ready

Built-in auth support:

- JWT tokens
- Role-based access control (RBAC)
- Policy-based permissions
- Owner/authenticated/public policies

## 🔧 Configuration

### Config File Formats

The app auto-detects (in order):

1. `config.ts` - TypeScript (recommended)
2. `manifest.yaml` - YAML
3. `manifest.json` - JSON
4. `config.json` - JSON

### Entity Definition

```typescript
{
  name: 'Product',           // Entity name
  tableName: 'products',     // Database table
  fields: [
    {
      name: 'id',
      type: 'uuid',           // Field type
      primary: true,          // Primary key
      generated: true,        // Auto-generated
    },
    {
      name: 'price',
      type: 'decimal',
      precision: 10,
      scale: 2,
      required: true,
      min: 0,                 // Validation
    }
  ],
  policies: {
    list: 'public',          // Anyone can list
    create: 'authenticated', // Must be logged in
    update: 'owner',         // Only owner can update
    delete: 'role:admin',    // Only admins can delete
  }
}
```

### Field Types

- `uuid` - UUID string
- `string` - Short text
- `text` - Long text
- `richtext` - Rich text/HTML
- `integer` - Whole number
- `decimal` - Decimal number
- `float` - Floating point
- `boolean` - True/false
- `enum` - Predefined values
- `timestamp` - Date/time
- `date` - Date only
- `json` - JSON object
- `file` - File reference

### Access Policies

- `public` - Anyone
- `authenticated` - Logged in users
- `owner` - Resource owner
- `role:admin` - Specific role
- `owner || role:admin` - Logical OR
- `authenticated && role:manager` - Logical AND

## 🚀 Deployment

### Cloudflare Workers

```bash
# 1. Create D1 database
wrangler d1 create baas-starter

# 2. Update wrangler.toml with database_id
# 3. Deploy
npm run deploy
```

### Node.js Server

```bash
# Build
npm run build

# Run
npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```bash
docker build -t baas-app .
docker run -p 3000:3000 baas-app
```

## 🔌 Extending

### Add Custom Routes

```typescript
// src/app.ts
export function createApp(config: Manifest): Hono {
  const app = new Hono();

  // ... usecore routes

  // Add custom route
  app.get("/custom", (c) => {
    return c.json({ message: "Custom endpoint" });
  });

  return app;
}
```

### Add Middleware

```typescript
import { logger } from "hono/logger";
import { cors } from "hono/cors";

app.use(logger());
app.use(
  cors({
    origin: ["https://example.com"],
    credentials: true,
  }),
);
```

### Connect Real Database

```typescript
// For Cloudflare Workers
export default {
  async fetch(request: Request, env: Env) {
    const app = createApp(config);

    // D1 database available in env.DB
    // KV store available in env.KV
    // R2 bucket available in env.R2

    return app.fetch(request, env);
  },
};
```

## 📚 Learn More

- [baas-workers Documentation](../../README.md)
- [@baas-workers/usecore API](../../packages/usecore/README.md)
- [@baas-workers/admin UI](../../packages/admin/README.md)
- [Hono Framework](https://hono.dev)
- [Cloudflare Workers](https://workers.cloudflare.com)

## 🤝 Contributing

Found a bug or have a feature request? [Open an issue](../../issues)

## 📄 License

MIT
