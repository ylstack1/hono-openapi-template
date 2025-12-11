# Architecture Diagrams

Visual guide to understanding how the starter app works.

## 1. The Core Pattern

```
┌─────────────────────────────────────────────────────────┐
│                      config.ts                          │
│  (Single source of truth - your data model)             │
│                                                          │
│  - Metadata (app name, version)                         │
│  - Features (auth, storage)                             │
│  - Entities (data models)                               │
│  - Policies (access control)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ loaded by
                     ▼
┌─────────────────────────────────────────────────────────┐
│            @baas-workers/usecore                        │
│  (Backend factory - turns config into full backend)     │
│                                                          │
│  - createManifestRouter(config)   → REST API            │
│  - generateOpenAPI(config)        → API docs            │
│  - generateMigrations(config)     → SQL migrations      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ creates
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Full Hono App                         │
│                                                          │
│  GET    /api/{entity}       - List entities             │
│  POST   /api/{entity}       - Create entity             │
│  GET    /api/{entity}/:id   - Get by ID                 │
│  PATCH  /api/{entity}/:id   - Update                    │
│  DELETE /api/{entity}/:id   - Delete                    │
│                                                          │
│  GET    /docs               - Swagger UI                │
│  GET    /openapi.json       - OpenAPI spec              │
│  GET    /health             - Health check              │
└─────────────────────────────────────────────────────────┘
```

## 2. Startup Flow

```
1. Start App (pnpm dev)
         │
         ▼
2. Load Config
   config-loader.ts
   ├── Try config.ts      ✓
   ├── Try manifest.yaml
   ├── Try manifest.json
   └── Try config.json
         │
         ▼
3. Validate Config
   Check structure, fields, types
         │
         ▼
4. Setup Database
   db-setup.ts
   ├── Check if migrations exist
   ├── If not: generate from config
   ├── Write to migrations/
   └── Apply to SQLite database
         │
         ▼
5. Create App
   app.ts
   ├── createManifestRouter(config)
   ├── generateOpenAPI(config)
   └── Mount routes
         │
         ▼
6. Start Server
   index.ts
   └── Listen on port 3000
         │
         ▼
7. ✅ Ready!
   - API: http://localhost:3000/api
   - Docs: http://localhost:3000/docs
```

## 3. Request Flow (Create Entity)

```
Client
  │
  │ POST /api/products
  │ { name: "Widget", price: 29.99 }
  │
  ▼
┌──────────────────────────────────────┐
│          Hono Router                 │
│  (created by createManifestRouter)   │
└────────────┬─────────────────────────┘
             │
             │ extract body
             ▼
┌──────────────────────────────────────┐
│      Entity Validator                │
│  (auto-generated from config)        │
│                                      │
│  - Type checking                     │
│  - Required fields                   │
│  - Min/max constraints               │
│  - Pattern validation                │
└────────────┬─────────────────────────┘
             │
             │ valid?
             ▼
┌──────────────────────────────────────┐
│      D1 Client (TODO)                │
│  Insert into database                │
└────────────┬─────────────────────────┘
             │
             │ success
             ▼
┌──────────────────────────────────────┐
│         JSON Response                │
│  { data: { id, name, price, ... } }  │
└──────────────────────────────────────┘
```

## 4. Data Model → Database

```
Config (config.ts)
┌────────────────────────────────┐
│ entities: [                    │
│   {                            │
│     name: 'Product',           │
│     fields: [                  │
│       { name: 'id', ... },     │
│       { name: 'name', ... },   │
│       { name: 'price', ... }   │
│     ]                          │
│   }                            │
│ ]                              │
└────────────┬───────────────────┘
             │
             │ generateMigrations()
             ▼
SQL Migration
┌────────────────────────────────┐
│ CREATE TABLE products (        │
│   id TEXT PRIMARY KEY,         │
│   name TEXT NOT NULL,          │
│   price REAL NOT NULL,         │
│   ...                          │
│ );                             │
└────────────┬───────────────────┘
             │
             │ apply
             ▼
SQLite Database
┌────────────────────────────────┐
│ ┌──────────────────────────┐   │
│ │     products table       │   │
│ ├──────┬───────┬───────────┤   │
│ │  id  │ name  │  price    │   │
│ ├──────┼───────┼───────────┤   │
│ │ uuid │ text  │   real    │   │
│ └──────┴───────┴───────────┘   │
└────────────────────────────────┘
```

## 5. Config → OpenAPI

```
Config Field Definition
┌────────────────────────────────┐
│ {                              │
│   name: 'price',               │
│   type: 'decimal',             │
│   required: true,              │
│   min: 0,                      │
│   precision: 10,               │
│   scale: 2                     │
│ }                              │
└────────────┬───────────────────┘
             │
             │ generateOpenAPI()
             ▼
OpenAPI Schema
┌────────────────────────────────┐
│ {                              │
│   "price": {                   │
│     "type": "number",          │
│     "minimum": 0,              │
│     "description": "..."       │
│   }                            │
│ }                              │
└────────────┬───────────────────┘
             │
             │ rendered by
             ▼
Swagger UI
┌────────────────────────────────┐
│  POST /api/products            │
│  ┌──────────────────────────┐  │
│  │ Request Body             │  │
│  │   price: number (min: 0) │  │
│  │   name: string           │  │
│  └──────────────────────────┘  │
│  [Try it out]                  │
└────────────────────────────────┘
```

## 6. Deployment Paths

```
                    Starter App
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   Node.js         Cloudflare        Docker
                    Workers
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ pnpm build   │ │ wrangler     │ │ docker build │
│ pnpm start   │ │ deploy       │ │ docker run   │
│              │ │              │ │              │
│ Uses:        │ │ Uses:        │ │ Uses:        │
│ - Local FS   │ │ - D1         │ │ - Container  │
│ - SQLite     │ │ - KV         │ │ - SQLite     │
│ - Port 3000  │ │ - R2         │ │ - Any port   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 7. File Structure

```
starter-app/
│
├── config.ts ────────────► Single source of truth
│   └── Defines:
│       ├── Entities
│       ├── Fields
│       ├── Validation
│       └── Policies
│
├── src/
│   ├── index.ts ─────────► Entry point
│   │   └── Orchestrates:
│   │       ├── Load config
│   │       ├── Validate
│   │       ├── Setup DB
│   │       └── Start server
│   │
│   ├── config-loader.ts ─► Auto-detect config
│   │   └── Supports:
│   │       ├── config.ts
│   │       ├── manifest.yaml
│   │       ├── manifest.json
│   │       └── config.json
│   │
│   ├── db-setup.ts ──────► Auto-migrate
│   │   └── On first run:
│   │       ├── Generate SQL
│   │       ├── Write migration
│   │       └── Apply to DB
│   │
│   └── app.ts ───────────► Create Hono app
│       └── Uses usecore:
│           ├── createManifestRouter()
│           ├── generateOpenAPI()
│           └── Mount routes
│
├── migrations/ ──────────► Generated SQL files
│   └── {timestamp}_init.sql
│
└── data/ ────────────────► SQLite database
    └── app.db
```

## 8. Extension Points

```
                    Starter App
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  Custom Routes    Custom Middleware   Custom Logic
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Edit app.ts  │  │ Edit app.ts  │  │ Add files in │
│              │  │              │  │ src/         │
│ app.get(     │  │ app.use(     │  │              │
│   '/custom', │  │   logger()   │  │ Import and   │
│   handler    │  │ )            │  │ use anywhere │
│ )            │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

These diagrams should help you understand how the starter app works and where to make changes!
