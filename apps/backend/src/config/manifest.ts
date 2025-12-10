import type { Manifest } from "@baas-workers/usecore";

/**
 * Load manifest configuration from embedded YAML content or file
 * In production, this would be embedded at build time
 */
export function loadManifest(): Manifest {
  // For now, return a basic manifest structure
  // In production, this would load from an embedded manifest.yaml or environment
  return {
    metadata: {
      name: "BaaS Workers Platform",
      version: "1.0.0",
      description: "Backend-as-a-Service platform built on Cloudflare Workers",
    },
    features: {
      auth: {
        enabled: true,
        providers: ["phone_password"],
      },
      durableObjects: {
        enabled: false,
      },
      realtime: {
        enabled: false,
      },
      storage: {
        enabled: false,
      },
      cron: {
        enabled: false,
      },
    },
    entities: [
      {
        name: "Store",
        tableName: "stores",
        fields: [
          {
            name: "id",
            type: "uuid",
            primary: true,
            generated: true,
          },
          {
            name: "name",
            type: "string",
            required: true,
            maxLength: 255,
          },
          {
            name: "ownerId",
            type: "uuid",
            required: true,
            references: "User.id",
          },
          {
            name: "description",
            type: "text",
            required: false,
          },
          {
            name: "logo",
            type: "string",
            required: false,
          },
          {
            name: "status",
            type: "enum",
            values: ["active", "inactive", "suspended"],
            default: "active",
          },
          {
            name: "createdAt",
            type: "timestamp",
            generated: true,
          },
          {
            name: "updatedAt",
            type: "timestamp",
            generated: true,
            updated: true,
          },
        ],
        policies: {
          list: "public",
          get: "public",
          create: "authenticated",
          update: "owner",
          delete: "owner",
        },
      },
      {
        name: "User",
        tableName: "users",
        fields: [
          {
            name: "id",
            type: "uuid",
            primary: true,
            generated: true,
          },
          {
            name: "name",
            type: "string",
            required: true,
            maxLength: 255,
          },
          {
            name: "email",
            type: "string",
            required: false,
            unique: true,
            maxLength: 255,
            validation: "email",
          },
          {
            name: "phoneNumber",
            type: "string",
            required: true,
            unique: true,
            maxLength: 20,
          },
          {
            name: "passwordHash",
            type: "string",
            required: true,
            sensitive: true,
          },
          {
            name: "role",
            type: "enum",
            values: ["customer", "merchant", "admin"],
            default: "customer",
          },
          {
            name: "emailVerified",
            type: "boolean",
            default: false,
          },
          {
            name: "phoneVerified",
            type: "boolean",
            default: false,
          },
          {
            name: "createdAt",
            type: "timestamp",
            generated: true,
          },
          {
            name: "updatedAt",
            type: "timestamp",
            generated: true,
            updated: true,
          },
        ],
        policies: {
          list: "role:admin",
          get: "owner || role:admin",
          create: "public",
          update: "owner",
          delete: "role:admin",
        },
      },
      {
        name: "Product",
        tableName: "products",
        fields: [
          {
            name: "id",
            type: "uuid",
            primary: true,
            generated: true,
          },
          {
            name: "storeId",
            type: "uuid",
            required: true,
            references: "Store.id",
          },
          {
            name: "name",
            type: "string",
            required: true,
            maxLength: 255,
          },
          {
            name: "description",
            type: "text",
            required: false,
          },
          {
            name: "price",
            type: "decimal",
            required: true,
            precision: 10,
            scale: 2,
          },
          {
            name: "currency",
            type: "string",
            required: true,
            default: "USD",
            maxLength: 3,
          },
          {
            name: "inventory",
            type: "integer",
            required: false,
          },
          {
            name: "status",
            type: "enum",
            values: ["draft", "active", "archived"],
            default: "draft",
          },
          {
            name: "createdAt",
            type: "timestamp",
            generated: true,
          },
          {
            name: "updatedAt",
            type: "timestamp",
            generated: true,
            updated: true,
          },
        ],
        policies: {
          list: "public",
          get: "public",
          create: "authenticated",
          update: "owner",
          delete: "owner",
        },
      },
    ],
  };
}

export const manifest = loadManifest();
