# Changelog

All notable changes to the baas-workers starter app will be documented in this file.

## [1.0.0] - 2024-12-11

### Added

#### Core Features

- ✅ Single `config.ts` file as source of truth for entire backend
- ✅ Auto-generated REST API from config using `@baas-workers/usecore`
- ✅ Auto-generated OpenAPI 3.0 specification
- ✅ Auto-generated database migrations from config
- ✅ Auto-detection of config files (config.ts, manifest.yaml, manifest.json)
- ✅ Auto-migration on first run (creates database + tables)
- ✅ Interactive Swagger UI documentation at `/docs`
- ✅ Health check endpoint at `/health`
- ✅ Type-safe validation with Zod (auto-generated from config)
- ✅ Full TypeScript support with strict mode

#### Development

- ✅ Hot reload with `tsx watch`
- ✅ Local SQLite database for development
- ✅ Comprehensive error messages and startup logging
- ✅ ESLint + Prettier + TypeScript configured
- ✅ Example configs (YAML format)

#### Deployment

- ✅ Cloudflare Workers support (wrangler.toml included)
- ✅ Docker support (Dockerfile + .dockerignore)
- ✅ Node.js deployment ready
- ✅ Environment variable support (.env.example)

#### Documentation

- ✅ Comprehensive README with examples
- ✅ Architecture documentation (ARCHITECTURE.md)
- ✅ Quick start guide (QUICKSTART.md)
- ✅ Contributing guide (CONTRIBUTING.md)
- ✅ This changelog

#### Example Entities

- Product entity with fields: id, name, price, description, category, image, isActive
- Store entity with fields: id, name, domain, description
- Both with auto-generated CRUD endpoints
- Public read access, authenticated write access

### Technical Details

#### Dependencies

- `@baas-workers/usecore` - Backend factory with router/OpenAPI/migrations
- `@baas-workers/admin` - Admin UI components (ready for integration)
- `hono` - Web framework
- `@hono/node-server` - Node.js adapter
- `yaml` - YAML config parsing
- `sqlite3` - Local database (dev only)

#### Project Structure

```
starter-app/
├── config.ts           # Single source of truth
├── src/
│   ├── app.ts         # Hono app creation
│   ├── index.ts       # Entry point
│   ├── config-loader.ts  # Auto-detection
│   └── db-setup.ts    # Auto-migration
├── examples/          # Example configs
├── migrations/        # Generated SQL (created on first run)
└── data/             # SQLite database (created on first run)
```

### Usage

```bash
# Install
pnpm install

# Run
pnpm dev

# Build
pnpm build

# Deploy
pnpm deploy  # or: wrangler deploy
```

### Known Limitations

- Database operations return mock data (TODO: implement D1 client integration)
- Admin UI is placeholder (ready for `@baas-workers/admin` integration)
- Authentication endpoints not yet implemented
- File upload not yet implemented
- No caching layer yet

### Future Plans

See [ARCHITECTURE.md](./ARCHITECTURE.md) for planned enhancements.

---

[1.0.0]: https://github.com/yourusername/baas-workers/releases/tag/v1.0.0
