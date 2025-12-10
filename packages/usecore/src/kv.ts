import { tryCatch, type Result } from "catch-wrap";

export interface KVOptions {
  expirationTtl?: number;
  expiration?: number;
  metadata?: Record<string, unknown>;
}

export interface SessionData {
  userId: string;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export interface CacheOptions extends KVOptions {
  tags?: string[];
}

export class KVClient {
  constructor(private readonly kv: KVNamespace) {}

  async get<T = unknown>(
    key: string,
    type: "text" | "json" | "arrayBuffer" | "stream" = "json",
  ): Promise<Result<T | null>> {
    return await tryCatch(async () => {
      let value: unknown;
      if (type === "text") {
        value = await this.kv.get(key, "text");
      } else if (type === "json") {
        value = await this.kv.get(key, "json");
      } else if (type === "arrayBuffer") {
        value = await this.kv.get(key, "arrayBuffer");
      } else {
        value = await this.kv.get(key, "stream");
      }
      return value as T | null;
    });
  }

  async put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: KVOptions,
  ): Promise<Result<void>> {
    return await tryCatch(async () => {
      await this.kv.put(key, value, options);
    });
  }

  async delete(key: string): Promise<Result<void>> {
    return await tryCatch(async () => {
      await this.kv.delete(key);
    });
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<Result<KVNamespaceListResult<unknown>>> {
    return await tryCatch(async () => {
      return await this.kv.list(options);
    });
  }
}

export class SessionStore {
  private readonly namespace = "session";

  constructor(private readonly kv: KVNamespace) {}

  async create(
    sessionId: string,
    data: Omit<SessionData, "createdAt">,
    ttlSeconds?: number,
  ): Promise<Result<SessionData>> {
    return await tryCatch(async () => {
      const now = Date.now();
      const sessionData: SessionData = {
        ...data,
        createdAt: now,
      };

      const key = this.getKey(sessionId);
      const ttl = ttlSeconds || this.getTTLFromExpiration(data.expiresAt);

      await this.kv.put(key, JSON.stringify(sessionData), {
        expirationTtl: ttl,
      });

      return sessionData;
    });
  }

  async get(sessionId: string): Promise<Result<SessionData | null>> {
    return await tryCatch(async () => {
      const key = this.getKey(sessionId);
      const value = await this.kv.get(key, "text");

      if (!value) {
        return null;
      }

      const session = JSON.parse(value) as SessionData;

      if (session.expiresAt && session.expiresAt < Date.now()) {
        await this.kv.delete(key);
        return null;
      }

      return session;
    });
  }

  async update(
    sessionId: string,
    data: Partial<Omit<SessionData, "userId" | "createdAt">>,
  ): Promise<Result<SessionData | null>> {
    return await tryCatch(async () => {
      const existingResult = await this.get(sessionId);
      if (existingResult.error || !existingResult.data) {
        return null;
      }

      const updated: SessionData = {
        ...existingResult.data,
        ...data,
      };

      const key = this.getKey(sessionId);
      const ttl = this.getTTLFromExpiration(updated.expiresAt);

      await this.kv.put(key, JSON.stringify(updated), {
        expirationTtl: ttl,
      });

      return updated;
    });
  }

  async delete(sessionId: string): Promise<Result<void>> {
    return await tryCatch(async () => {
      const key = this.getKey(sessionId);
      await this.kv.delete(key);
    });
  }

  async rotate(
    oldSessionId: string,
    newSessionId: string,
  ): Promise<Result<SessionData | null>> {
    return await tryCatch(async () => {
      const existingResult = await this.get(oldSessionId);
      if (existingResult.error || !existingResult.data) {
        return null;
      }

      const session = existingResult.data;
      await this.delete(oldSessionId);

      const newKey = this.getKey(newSessionId);
      const ttl = this.getTTLFromExpiration(session.expiresAt);

      await this.kv.put(newKey, JSON.stringify(session), {
        expirationTtl: ttl,
      });

      return session;
    });
  }

  async extend(
    sessionId: string,
    additionalSeconds: number,
  ): Promise<Result<SessionData | null>> {
    return await tryCatch(async () => {
      const existingResult = await this.get(sessionId);
      if (existingResult.error || !existingResult.data) {
        return null;
      }

      const session = existingResult.data;
      const newExpiresAt = session.expiresAt + additionalSeconds * 1000;

      return (await this.update(sessionId, { expiresAt: newExpiresAt })).data;
    });
  }

  private getKey(sessionId: string): string {
    return `${this.namespace}:${sessionId}`;
  }

  private getTTLFromExpiration(expiresAt: number): number {
    const now = Date.now();
    const ttlMs = expiresAt - now;
    return Math.max(Math.floor(ttlMs / 1000), 60);
  }
}

export class CacheClient {
  private readonly namespace = "cache";

  constructor(private readonly kv: KVNamespace) {}

  async get<T = unknown>(key: string): Promise<Result<T | null>> {
    return await tryCatch(async () => {
      const cacheKey = this.getKey(key);
      const value = await this.kv.get(cacheKey, "text");

      if (!value) {
        return null;
      }

      const cached = JSON.parse(value) as {
        data: T;
        tags?: string[];
        cachedAt: number;
      };
      return cached.data;
    });
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<Result<void>> {
    return await tryCatch(async () => {
      const cacheKey = this.getKey(key);
      const cached = {
        data: value,
        tags: options?.tags,
        cachedAt: Date.now(),
      };

      await this.kv.put(cacheKey, JSON.stringify(cached), {
        expirationTtl: options?.expirationTtl,
        expiration: options?.expiration,
        metadata: options?.metadata,
      });
    });
  }

  async delete(key: string): Promise<Result<void>> {
    return await tryCatch(async () => {
      const cacheKey = this.getKey(key);
      await this.kv.delete(cacheKey);
    });
  }

  async invalidateByTag(tag: string): Promise<Result<number>> {
    return await tryCatch(async () => {
      let invalidated = 0;
      const prefix = this.namespace;
      let cursor: string | undefined;

      do {
        const list = await this.kv.list({ prefix, cursor });

        for (const key of list.keys) {
          const value = await this.kv.get(key.name, "text");
          if (value) {
            const cached = JSON.parse(value) as {
              data: unknown;
              tags?: string[];
              cachedAt: number;
            };
            if (cached.tags?.includes(tag)) {
              await this.kv.delete(key.name);
              invalidated++;
            }
          }
        }

        cursor = list.list_complete
          ? undefined
          : (list as { cursor?: string }).cursor;
      } while (cursor);

      return invalidated;
    });
  }

  async invalidateByPrefix(keyPrefix: string): Promise<Result<number>> {
    return await tryCatch(async () => {
      let invalidated = 0;
      const prefix = this.getKey(keyPrefix);
      let cursor: string | undefined;

      do {
        const list = await this.kv.list({ prefix, cursor });

        for (const key of list.keys) {
          await this.kv.delete(key.name);
          invalidated++;
        }

        cursor = list.list_complete
          ? undefined
          : (list as { cursor?: string }).cursor;
      } while (cursor);

      return invalidated;
    });
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

export function createKVClient(kv: KVNamespace): KVClient {
  return new KVClient(kv);
}

export function createSessionStore(kv: KVNamespace): SessionStore {
  return new SessionStore(kv);
}

export function createCacheClient(kv: KVNamespace): CacheClient {
  return new CacheClient(kv);
}
