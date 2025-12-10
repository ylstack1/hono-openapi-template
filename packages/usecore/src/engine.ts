import type { Result } from "catch-wrap";

import type { AuthClient } from "./auth";
import type { D1Client } from "./d1-client";
import type { CacheClient, KVClient, SessionStore } from "./kv";
import type { R2Client } from "./r2";
import type { EntityDefinition, RBACValidator } from "./validation";

import { EntityValidator } from "./validation";

export interface ManifestMetadata {
  name: string;
  version: string;
  description?: string;
}

export interface FeatureFlags {
  auth?: {
    enabled: boolean;
    providers?: string[];
  };
  durableObjects?: {
    enabled: boolean;
  };
  realtime?: {
    enabled: boolean;
  };
  storage?: {
    enabled: boolean;
  };
  cron?: {
    enabled: boolean;
  };
}

export interface Manifest {
  metadata?: ManifestMetadata;
  features?: FeatureFlags;
  entities?: EntityDefinition[];
}

export interface EngineConfig {
  manifest: Manifest;
  d1Client?: D1Client;
  kvClient?: KVClient;
  r2Client?: R2Client;
  authClient?: AuthClient;
  sessionStore?: SessionStore;
  cacheClient?: CacheClient;
  logger?: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    debug: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

export interface EntityConfig {
  definition: EntityDefinition;
  validator: EntityValidator;
  client: D1Client;
}

export interface AuthMiddleware {
  authenticate: (
    token: string,
  ) => Promise<Result<{ userId: string; role?: string }>>;
  authorize: (
    userId: string,
    resource: string,
    action: string,
  ) => Promise<Result<boolean>>;
}

export interface PolicyEvaluator {
  evaluate: (policy: string, context: Record<string, unknown>) => boolean;
  canList: (entity: string, context: Record<string, unknown>) => boolean;
  canGet: (entity: string, context: Record<string, unknown>) => boolean;
  canCreate: (entity: string, context: Record<string, unknown>) => boolean;
  canUpdate: (entity: string, context: Record<string, unknown>) => boolean;
  canDelete: (entity: string, context: Record<string, unknown>) => boolean;
}

export interface Plugin {
  name: string;
  version: string;
  initialize: (engine: Engine) => Promise<void> | void;
  hooks?: {
    beforeRequest?: (ctx: Record<string, unknown>) => Promise<void> | void;
    afterRequest?: (ctx: Record<string, unknown>) => Promise<void> | void;
    beforeQuery?: (ctx: Record<string, unknown>) => Promise<void> | void;
    afterQuery?: (ctx: Record<string, unknown>) => Promise<void> | void;
  };
}

export interface FeatureFlagChecker {
  isEnabled: (feature: string) => boolean;
  isAuthEnabled: () => boolean;
  isDurableObjectsEnabled: () => boolean;
  isRealtimeEnabled: () => boolean;
  isStorageEnabled: () => boolean;
  isCronEnabled: () => boolean;
}

export class Engine {
  private readonly config: EngineConfig;
  private readonly entityConfigs: Map<string, EntityConfig> = new Map();
  private readonly plugins: Map<string, Plugin> = new Map();
  private rbacValidator?: RBACValidator;

  constructor(config: EngineConfig) {
    this.config = config;
    this.initializeEntities();
  }

  private initializeEntities(): void {
    if (!this.config.manifest.entities || !this.config.d1Client) {
      return;
    }

    for (const entity of this.config.manifest.entities) {
      const validator = new EntityValidator(entity);

      this.entityConfigs.set(entity.name, {
        definition: entity,
        validator,
        client: this.config.d1Client,
      });

      this.config.logger?.debug("Entity initialized", { entity: entity.name });
    }
  }

  getEntityConfig(name: string): EntityConfig | undefined {
    return this.entityConfigs.get(name);
  }

  getAllEntities(): EntityConfig[] {
    return Array.from(this.entityConfigs.values());
  }

  getAuthMiddleware(): AuthMiddleware | undefined {
    if (!this.config.authClient) {
      return undefined;
    }

    const authClient = this.config.authClient;
    const rbacValidator = this.rbacValidator;

    return {
      authenticate: async (token: string) => {
        const result = await authClient.verifyToken(token);
        if (result.error || !result.data) {
          return {
            data: null,
            error: result.error || new Error("Authentication failed"),
          };
        }
        return {
          data: {
            userId: result.data.sub,
            role: result.data["role"] as string | undefined,
          },
          error: null,
        };
      },
      authorize: async (userId: string, resource: string, action: string) => {
        if (!rbacValidator) {
          return { data: true, error: null };
        }

        const hasPermission = rbacValidator.hasPermission(
          "user",
          resource,
          action,
          { userId },
        );
        return { data: hasPermission, error: null };
      },
    };
  }

  getPolicyEvaluator(): PolicyEvaluator {
    const manifest = this.config.manifest;

    return {
      evaluate: (policy: string, context: Record<string, unknown>): boolean => {
        if (policy === "public") return true;
        if (policy === "authenticated") return !!context["userId"];
        if (policy === "owner") return context["isOwner"] === true;

        if (policy.startsWith("role:")) {
          const requiredRole = policy.substring(5);
          return context["role"] === requiredRole;
        }

        if (policy.includes("||")) {
          const parts = policy.split("||").map((p) => p.trim());
          return parts.some((part) =>
            this.getPolicyEvaluator().evaluate(part, context),
          );
        }

        if (policy.includes("&&")) {
          const parts = policy.split("&&").map((p) => p.trim());
          return parts.every((part) =>
            this.getPolicyEvaluator().evaluate(part, context),
          );
        }

        return false;
      },
      canList: (entity: string, context: Record<string, unknown>): boolean => {
        const entityDef = manifest.entities?.find((e) => e.name === entity);
        if (!entityDef?.policies?.list) return true;
        return this.getPolicyEvaluator().evaluate(
          entityDef.policies.list,
          context,
        );
      },
      canGet: (entity: string, context: Record<string, unknown>): boolean => {
        const entityDef = manifest.entities?.find((e) => e.name === entity);
        if (!entityDef?.policies?.get) return true;
        return this.getPolicyEvaluator().evaluate(
          entityDef.policies.get,
          context,
        );
      },
      canCreate: (
        entity: string,
        context: Record<string, unknown>,
      ): boolean => {
        const entityDef = manifest.entities?.find((e) => e.name === entity);
        if (!entityDef?.policies?.create) return true;
        return this.getPolicyEvaluator().evaluate(
          entityDef.policies.create,
          context,
        );
      },
      canUpdate: (
        entity: string,
        context: Record<string, unknown>,
      ): boolean => {
        const entityDef = manifest.entities?.find((e) => e.name === entity);
        if (!entityDef?.policies?.update) return true;
        return this.getPolicyEvaluator().evaluate(
          entityDef.policies.update,
          context,
        );
      },
      canDelete: (
        entity: string,
        context: Record<string, unknown>,
      ): boolean => {
        const entityDef = manifest.entities?.find((e) => e.name === entity);
        if (!entityDef?.policies?.delete) return true;
        return this.getPolicyEvaluator().evaluate(
          entityDef.policies.delete,
          context,
        );
      },
    };
  }

  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
    plugin.initialize(this);
    this.config.logger?.info("Plugin registered", {
      name: plugin.name,
      version: plugin.version,
    });
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getFeatureFlagChecker(): FeatureFlagChecker {
    const features = this.config.manifest.features || {};

    return {
      isEnabled: (feature: string): boolean => {
        const parts = feature.split(".");
        let current: FeatureFlags | undefined | boolean = features;

        for (const part of parts) {
          if (typeof current === "object" && current !== null) {
            current = (
              current as Record<string, FeatureFlags | boolean | undefined>
            )[part];
          } else {
            return false;
          }
        }

        if (typeof current === "object" && current !== null) {
          return (current as { enabled?: boolean }).enabled === true;
        }

        return current === true;
      },
      isAuthEnabled: (): boolean => features.auth?.enabled === true,
      isDurableObjectsEnabled: (): boolean =>
        features.durableObjects?.enabled === true,
      isRealtimeEnabled: (): boolean => features.realtime?.enabled === true,
      isStorageEnabled: (): boolean => features.storage?.enabled === true,
      isCronEnabled: (): boolean => features.cron?.enabled === true,
    };
  }

  getD1Client(): D1Client | undefined {
    return this.config.d1Client;
  }

  getKVClient(): KVClient | undefined {
    return this.config.kvClient;
  }

  getR2Client(): R2Client | undefined {
    return this.config.r2Client;
  }

  getAuthClient(): AuthClient | undefined {
    return this.config.authClient;
  }

  getSessionStore(): SessionStore | undefined {
    return this.config.sessionStore;
  }

  getCacheClient(): CacheClient | undefined {
    return this.config.cacheClient;
  }

  getLogger() {
    return this.config.logger;
  }

  getManifest(): Manifest {
    return this.config.manifest;
  }
}

export function buildEngine(config: EngineConfig): Engine {
  return new Engine(config);
}
