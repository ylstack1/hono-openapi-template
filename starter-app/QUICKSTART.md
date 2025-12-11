# 🚀 Quick Start Guide

Get your backend running in under 5 minutes!

## Step 1: Install (30 seconds)

```bash
pnpm install
```

## Step 2: Run (5 seconds)

```bash
pnpm dev
```

That's it! Your backend is now running with:

- ✅ REST API at http://localhost:3000/api
- ✅ Swagger docs at http://localhost:3000/docs
- ✅ OpenAPI spec at http://localhost:3000/openapi.json
- ✅ Database auto-created with migrations
- ✅ Full type safety with TypeScript

## Step 3: Test It

### List products

```bash
curl http://localhost:3000/api/products
```

### Create a product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Product",
    "price": 29.99,
    "category": "Electronics"
  }'
```

### Get product by ID

```bash
curl http://localhost:3000/api/products/{id}
```

## What Just Happened?

The starter app:

1. ✅ Loaded `config.ts` (your data model)
2. ✅ Generated SQL migrations from config
3. ✅ Created SQLite database at `data/app.db`
4. ✅ Applied migrations (created tables)
5. ✅ Started Hono server with auto-generated routes
6. ✅ Exposed OpenAPI spec and Swagger UI

All from that single `config.ts` file!

## Next Steps

### Modify Your Data Model

Edit `config.ts` to add fields or entities:

```typescript
{
  name: 'stock',
  type: 'integer',
  required: false,
  default: 0
}
```

Restart the server - new migrations are auto-generated!

### Add Authentication

Enable auth in config:

```typescript
features: {
  auth: {
    enabled: true,
    providers: ['phone_password']
  }
}
```

### Deploy

#### To Cloudflare Workers

```bash
wrangler deploy
```

#### To Docker

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

#### To any Node.js host

```bash
pnpm build
pnpm start
```

## Learn More

- [Full README](./README.md) - Complete documentation
- [Architecture](./ARCHITECTURE.md) - How it works
- [Contributing](./CONTRIBUTING.md) - Make changes

## Common Issues

### Port 3000 already in use?

```bash
PORT=3001 pnpm dev
```

### Want a different database path?

```bash
DATABASE_PATH=./my-db.db pnpm dev
```

### Can't find config?

Make sure `config.ts` exists in the root directory.

## Questions?

Open an issue in the [main repository](https://github.com/yourusername/baas-workers).

---

**That's it! You now have a production-ready backend with:**

- Auto-generated REST API
- Type-safe validation
- OpenAPI documentation
- Database migrations
- Full TypeScript support

**All from a single config file. 🎉**
