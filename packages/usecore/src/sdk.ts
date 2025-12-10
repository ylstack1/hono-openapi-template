import { tryCatch, type Result } from "catch-wrap";

import type { EntityDefinition } from "./validation";

export interface SDKConfig {
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  filters?: Record<string, unknown>;
}

export interface SDKResponse<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface WebhookSignature {
  timestamp: number;
  signature: string;
}

export class SDKClient {
  private readonly config: SDKConfig;
  private rateLimitInfo?: RateLimitInfo;

  constructor(config: SDKConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string> },
  ): Promise<Result<SDKResponse<T>>> {
    return await tryCatch(async () => {
      const url = `${this.config.baseUrl}${path}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...options?.headers,
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        this.extractRateLimitInfo(response.headers);

        const data = await response.json().catch(() => null);

        const result: SDKResponse<T> = {
          data: response.ok ? (data as T) : null,
          error: response.ok
            ? null
            : (data as { message?: string })?.message || response.statusText,
          statusCode: response.status,
        };

        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  async retryRequest<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    attempt = 0,
  ): Promise<Result<SDKResponse<T>>> {
    const result = await this.request<T>(method, path, body);

    if (
      result.error &&
      attempt < this.config.retryAttempts! &&
      this.isRetryable(result.error)
    ) {
      await this.delay(this.config.retryDelay! * Math.pow(2, attempt));
      return await this.retryRequest<T>(method, path, body, attempt + 1);
    }

    return result;
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  private extractRateLimitInfo(headers: Headers): void {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
      };
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED")
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): Promise<Result<boolean>> {
    return await tryCatch(async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const key = encoder.encode(secret);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      return computedSignature === signature;
    });
  }

  generateWebhookSignature(
    payload: string,
    secret: string,
  ): Promise<Result<WebhookSignature>> {
    return tryCatch(async () => {
      const timestamp = Date.now();
      const signaturePayload = `${timestamp}.${payload}`;

      const encoder = new TextEncoder();
      const data = encoder.encode(signaturePayload);
      const key = encoder.encode(secret);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      return { timestamp, signature };
    });
  }
}

export class EntitySDK<
  TCreate = unknown,
  TUpdate = unknown,
  TEntity = unknown,
> {
  constructor(
    private readonly client: SDKClient,
    private readonly basePath: string,
  ) {}

  async list(options?: ListOptions): Promise<Result<SDKResponse<TEntity[]>>> {
    const queryParams = new URLSearchParams();

    if (options?.limit) queryParams.set("limit", options.limit.toString());
    if (options?.offset) queryParams.set("offset", options.offset.toString());
    if (options?.orderBy) queryParams.set("orderBy", options.orderBy);
    if (options?.orderDirection)
      queryParams.set("orderDirection", options.orderDirection);

    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        queryParams.set(key, String(value));
      }
    }

    const path = `${this.basePath}?${queryParams.toString()}`;
    return await this.client.retryRequest<TEntity[]>("GET", path);
  }

  async get(id: string): Promise<Result<SDKResponse<TEntity>>> {
    const path = `${this.basePath}/${id}`;
    return await this.client.retryRequest<TEntity>("GET", path);
  }

  async create(data: TCreate): Promise<Result<SDKResponse<TEntity>>> {
    return await this.client.retryRequest<TEntity>("POST", this.basePath, data);
  }

  async update(
    id: string,
    data: TUpdate,
  ): Promise<Result<SDKResponse<TEntity>>> {
    const path = `${this.basePath}/${id}`;
    return await this.client.retryRequest<TEntity>("PATCH", path, data);
  }

  async delete(id: string): Promise<Result<SDKResponse<void>>> {
    const path = `${this.basePath}/${id}`;
    return await this.client.retryRequest<void>("DELETE", path);
  }
}

export class TypedSDK {
  private readonly client: SDKClient;
  private readonly entities: Map<string, EntitySDK<unknown, unknown, unknown>> =
    new Map();

  constructor(config: SDKConfig) {
    this.client = new SDKClient(config);
  }

  registerEntity<TCreate = unknown, TUpdate = unknown, TEntity = unknown>(
    definition: EntityDefinition,
  ): EntitySDK<TCreate, TUpdate, TEntity> {
    const basePath = `/${definition.tableName}`;
    const sdk = new EntitySDK<TCreate, TUpdate, TEntity>(this.client, basePath);
    this.entities.set(definition.name, sdk);
    return sdk;
  }

  getEntity<TCreate = unknown, TUpdate = unknown, TEntity = unknown>(
    name: string,
  ): EntitySDK<TCreate, TUpdate, TEntity> | undefined {
    return this.entities.get(name) as
      | EntitySDK<TCreate, TUpdate, TEntity>
      | undefined;
  }

  getClient(): SDKClient {
    return this.client;
  }
}

export function createSDKClient(config: SDKConfig): SDKClient {
  return new SDKClient(config);
}

export function createTypedSDK(config: SDKConfig): TypedSDK {
  return new TypedSDK(config);
}

export function createEntitySDK<
  TCreate = unknown,
  TUpdate = unknown,
  TEntity = unknown,
>(client: SDKClient, basePath: string): EntitySDK<TCreate, TUpdate, TEntity> {
  return new EntitySDK<TCreate, TUpdate, TEntity>(client, basePath);
}
