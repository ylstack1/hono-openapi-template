# Contributing to baas-workers Starter App

Thank you for your interest in contributing! This is a starter template to help you get started with baas-workers.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/baas-workers-starter.git
   cd baas-workers-starter
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure your app**
   - Edit `config.ts` to define your data model
   - See examples in `examples/` directory

4. **Run development server**
   ```bash
   pnpm dev
   ```

## Project Structure

```
starter-app/
├── config.ts              # Main configuration file
├── src/
│   ├── app.ts            # Hono app creation
│   ├── index.ts          # Entry point
│   ├── config-loader.ts  # Config file auto-detection
│   └── db-setup.ts       # Database auto-migration
├── examples/             # Example configs
└── migrations/           # Generated SQL migrations
```

## Making Changes

### Adding a New Entity

1. Edit `config.ts`
2. Add a new entity to the `entities` array
3. Restart the server - migrations are auto-generated

### Adding Custom Routes

Edit `src/app.ts` and add your custom routes:

```typescript
export function createApp(config: Manifest): Hono {
  const app = new Hono();

  // ... existing routes

  // Add custom route
  app.get("/custom", (c) => {
    return c.json({ message: "Custom endpoint" });
  });

  return app;
}
```

### Modifying Config Loader

Edit `src/config-loader.ts` to change how configs are loaded.

## Testing

Currently, the starter app doesn't include tests. Feel free to add:

- Unit tests with Vitest
- Integration tests
- E2E tests with Playwright

## Deployment

See [README.md](README.md) for deployment instructions:

- Cloudflare Workers
- Node.js
- Docker

## Questions?

Open an issue in the main [baas-workers repository](https://github.com/yourusername/baas-workers).
