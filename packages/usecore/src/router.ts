import { Hono } from "hono";

import type { Manifest } from "./engine";

import { EntityValidator } from "./validation";

export interface RouterContext {
  engine?: unknown;
  user?: { id: string; role?: string };
}

/**
 * Create a Hono router from manifest configuration
 * This is the core function that enables "config → full backend"
 */
export function createManifestRouter(manifest: Manifest): Hono {
  const app = new Hono();

  // Health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      app: manifest.metadata?.name || "BaaS App",
      version: manifest.metadata?.version || "1.0.0",
    });
  });

  // Metadata endpoint
  app.get("/", (c) => {
    return c.json({
      name: manifest.metadata?.name || "BaaS App",
      version: manifest.metadata?.version || "1.0.0",
      description: manifest.metadata?.description || "",
      entities: manifest.entities?.map((e) => ({
        name: e.name,
        tableName: e.tableName,
        fields: e.fields.length,
      })),
    });
  });

  // Entity routes
  if (manifest.entities) {
    for (const entity of manifest.entities) {
      const validator = new EntityValidator(entity);
      const basePath = `/${entity.tableName || entity.name.toLowerCase()}`;

      // List entities
      app.get(basePath, async (c) => {
        // TODO: Implement with D1 client
        return c.json({
          data: [],
          meta: { total: 0, limit: 10, offset: 0 },
        });
      });

      // Create entity
      app.post(basePath, async (c) => {
        const body = await c.req.json();
        const validationResult = validator.validateCreate(body);

        if (!validationResult.success) {
          return c.json(
            {
              error: "Validation failed",
              errors: validationResult.errors,
            },
            400,
          );
        }

        // TODO: Implement with D1 client
        return c.json({ data: validationResult.data }, 201);
      });

      // Get entity by ID
      app.get(`${basePath}/:id`, async (c) => {
        const id = c.req.param("id");
        // TODO: Implement with D1 client
        return c.json({ data: { id } });
      });

      // Update entity
      app.patch(`${basePath}/:id`, async (c) => {
        const id = c.req.param("id");
        const body = await c.req.json();
        const validationResult = validator.validateUpdate(body);

        if (!validationResult.success) {
          return c.json(
            {
              error: "Validation failed",
              errors: validationResult.errors,
            },
            400,
          );
        }

        // TODO: Implement with D1 client
        const data = validationResult.data as Record<string, unknown>;
        return c.json({ data: { id, ...data } });
      });

      // Delete entity
      app.delete(`${basePath}/:id`, async (c) => {
        const id = c.req.param("id");
        // TODO: Implement with D1 client
        return c.json({ success: true, id });
      });
    }
  }

  return app;
}
