import { tryCatch, type Result } from "catch-wrap";

export interface D1QueryOptions {
  params?: unknown[];
  logger?: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

export interface D1TransactionContext {
  query<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<Result<D1Result<T>>>;
  exec(sql: string): Promise<Result<D1ExecResult>>;
}

export class D1Client {
  constructor(private readonly db: D1Database) {}

  async query<T = unknown>(
    sql: string,
    options?: D1QueryOptions,
  ): Promise<Result<D1Result<T>>> {
    const { params = [], logger } = options || {};

    if (this.containsStringInterpolation(sql)) {
      const error = new Error(
        "String interpolation detected. Use parameterized queries only.",
      );
      logger?.error("D1 query error", { error: error.message, sql });
      return { data: null, error };
    }

    return await tryCatch(async () => {
      logger?.info("D1 query", { sql, params });
      const statement = this.db.prepare(sql);
      return await statement.bind(...params).all<T>();
    });
  }

  async execute(
    sql: string,
    options?: D1QueryOptions,
  ): Promise<Result<D1Result>> {
    const { params = [], logger } = options || {};

    if (this.containsStringInterpolation(sql)) {
      const error = new Error(
        "String interpolation detected. Use parameterized queries only.",
      );
      logger?.error("D1 execute error", { error: error.message, sql });
      return { data: null, error };
    }

    return await tryCatch(async () => {
      logger?.info("D1 execute", { sql, params });
      const statement = this.db.prepare(sql);
      return await statement.bind(...params).run();
    });
  }

  async first<T = unknown>(
    sql: string,
    options?: D1QueryOptions,
  ): Promise<Result<T | null>> {
    const { params = [], logger } = options || {};

    if (this.containsStringInterpolation(sql)) {
      const error = new Error(
        "String interpolation detected. Use parameterized queries only.",
      );
      logger?.error("D1 first error", { error: error.message, sql });
      return { data: null, error };
    }

    return await tryCatch(async () => {
      logger?.info("D1 first", { sql, params });
      const statement = this.db.prepare(sql);
      return await statement.bind(...params).first<T>();
    });
  }

  async batch<T = unknown>(
    statements: Array<{ sql: string; params?: unknown[] }>,
    options?: Pick<D1QueryOptions, "logger">,
  ): Promise<Result<D1Result<T>[]>> {
    const { logger } = options || {};

    for (const stmt of statements) {
      if (this.containsStringInterpolation(stmt.sql)) {
        const error = new Error(
          "String interpolation detected. Use parameterized queries only.",
        );
        logger?.error("D1 batch error", {
          error: error.message,
          sql: stmt.sql,
        });
        return { data: null, error };
      }
    }

    return await tryCatch(async () => {
      logger?.info("D1 batch", { count: statements.length });
      const prepared = statements.map((stmt) =>
        this.db.prepare(stmt.sql).bind(...(stmt.params || [])),
      );
      return await this.db.batch<T>(prepared);
    });
  }

  async transaction<T>(
    fn: (ctx: D1TransactionContext) => Promise<T>,
    options?: Pick<D1QueryOptions, "logger">,
  ): Promise<Result<T>> {
    const { logger } = options || {};

    return await tryCatch(async () => {
      logger?.info("D1 transaction start");

      const ctx: D1TransactionContext = {
        query: async <R = unknown>(
          sql: string,
          params?: unknown[],
        ): Promise<Result<D1Result<R>>> => {
          return await this.query<R>(sql, { params, logger });
        },
        exec: async (sql: string): Promise<Result<D1ExecResult>> => {
          if (this.containsStringInterpolation(sql)) {
            const error = new Error(
              "String interpolation detected. Use parameterized queries only.",
            );
            logger?.error("D1 exec error", { error: error.message, sql });
            return { data: null, error };
          }
          return await tryCatch(async () => {
            logger?.info("D1 exec", { sql });
            return await this.db.exec(sql);
          });
        },
      };

      const result = await fn(ctx);
      logger?.info("D1 transaction complete");
      return result;
    });
  }

  private containsStringInterpolation(sql: string): boolean {
    const dangerousPatterns = [
      /\$\{[^}]+\}/,
      /\+\s*["'`]/,
      /["'`]\s*\+/,
      /template/i,
    ];
    return dangerousPatterns.some((pattern) => pattern.test(sql));
  }
}

export function createD1Client(db: D1Database): D1Client {
  return new D1Client(db);
}
