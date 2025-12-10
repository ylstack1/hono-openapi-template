import type { Engine } from "@baas-workers/usecore";

import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/types";

import { createEngineFactory } from "@/lib/factories/create-engine";

declare module "hono" {
  interface ContextVariableMap {
    engine?: Engine;
  }
}

// Singleton engine instance
let globalEngine: Engine | undefined;

/**
 * Initialize and inject Engine instance into the Hono context
 * Engine is created once and reused across requests
 */
export const engineMiddleware = () => {
  return createMiddleware<AppBindings>(async (c, next) => {
    try {
      // Initialize engine once
      if (!globalEngine) {
        const logger = c.get("logger");
        globalEngine = createEngineFactory(
          {
            DB: c.env.DB,
            KV: c.env.KV,
            R2: c.env.R2,
            JWT_SECRET: (c.env as any).JWT_SECRET as string | undefined,
          },
          logger,
        );
        logger.info("Engine initialized");
      }

      // Store engine in context for route handlers
      c.set("engine", globalEngine);

      return await next();
    } catch (error) {
      const logger = c.get("logger");
      logger.error("Failed to initialize engine", {
        error: error instanceof Error ? error.message : String(error),
      });
      return c.json(
        {
          error: "Internal Server Error",
          message: "Failed to initialize application engine",
        },
        500,
      );
    }
  });
};

/**
 * Get the global engine instance
 * Useful for initialization tasks outside request context
 */
export function getGlobalEngine(): Engine | undefined {
  return globalEngine;
}

/**
 * Set the global engine instance (for testing or explicit initialization)
 */
export function setGlobalEngine(engine: Engine | undefined): void {
  globalEngine = engine;
}

/**
 * Reset the global engine (for testing)
 */
export function resetGlobalEngine(): void {
  globalEngine = undefined;
}
