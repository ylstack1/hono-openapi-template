import type { PinoLogger } from "hono-pino";

import {
  buildEngine,
  createAuthClient,
  createD1Client,
  createKVClient,
  createR2Client,
  createSessionStore,
  type Engine,
} from "@baas-workers/usecore";

import { manifest } from "@/config/manifest";

/**
 * Environment bindings from Cloudflare Worker
 */
export type CloudflareEnvironment = {
  DB: D1Database;
  KV?: KVNamespace;
  R2?: R2Bucket;
  JWT_SECRET?: string;
};

/**
 * Create and configure the Engine instance with all clients
 */
export function createEngineFactory(
  env: CloudflareEnvironment,
  logger: PinoLogger,
): Engine {
  // Create clients
  const d1Client = createD1Client(env.DB);
  const kvClient = env.KV ? createKVClient(env.KV) : undefined;
  const r2Client = env.R2 ? createR2Client(env.R2) : undefined;

  // Create auth client if auth is enabled
  const sessionStore = kvClient ? createSessionStore(kvClient) : undefined;
  const authClient = manifest.features?.auth?.enabled
    ? createAuthClient(
        {
          secret: env.JWT_SECRET || "default-secret",
          algorithm: "HS256",
          expiresIn: 900,
        },
        sessionStore,
      )
    : undefined;

  // Build engine with manifest and clients
  const engine = buildEngine({
    manifest,
    d1Client,
    kvClient,
    r2Client,
    authClient,
    logger: {
      info: (msg: string, meta?: Record<string, unknown>) => {
        logger.info(meta || {}, msg);
      },
      error: (msg: string, meta?: Record<string, unknown>) => {
        logger.error(meta || {}, msg);
      },
      warn: (msg: string, meta?: Record<string, unknown>) => {
        logger.warn(meta || {}, msg);
      },
      debug: (msg: string, meta?: Record<string, unknown>) => {
        logger.debug(meta || {}, msg);
      },
    },
  });

  return engine;
}
