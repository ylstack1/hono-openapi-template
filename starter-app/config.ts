import type { Manifest } from "@baas-workers/usecore";

/**
 * Application configuration
 * This is the single source of truth for your entire backend
 */
const config: Manifest = {
  metadata: {
    name: "My Store",
    version: "1.0.0",
    description: "Starter app built with baas-workers",
  },

  features: {
    auth: {
      enabled: true,
      providers: ["phone_password"],
    },
    storage: {
      enabled: true,
    },
  },

  entities: [
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
          name: "name",
          type: "string",
          required: true,
          maxLength: 100,
          minLength: 3,
          description: "Product name",
        },
        {
          name: "description",
          type: "text",
          required: false,
          description: "Product description",
        },
        {
          name: "price",
          type: "decimal",
          required: true,
          min: 0,
          precision: 10,
          scale: 2,
          description: "Product price",
        },
        {
          name: "category",
          type: "enum",
          required: false,
          values: ["Electronics", "Clothing", "Books", "Other"],
          default: "Other",
        },
        {
          name: "image",
          type: "string",
          required: false,
          description: "Product image URL",
        },
        {
          name: "isActive",
          type: "boolean",
          required: false,
          default: true,
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
        update: "authenticated",
        delete: "authenticated",
      },
    },
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
          maxLength: 100,
          description: "Store name",
        },
        {
          name: "domain",
          type: "string",
          required: false,
          unique: true,
          maxLength: 100,
          description: "Store domain",
        },
        {
          name: "description",
          type: "text",
          required: false,
        },
        {
          name: "createdAt",
          type: "timestamp",
          generated: true,
        },
      ],
      policies: {
        list: "public",
        get: "public",
        create: "authenticated",
        update: "authenticated",
        delete: "authenticated",
      },
    },
  ],
};

export default config;
