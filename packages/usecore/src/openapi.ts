import type { Manifest } from "./engine";
import type { EntityField } from "./validation";

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

/**
 * Generate OpenAPI 3.0 specification from manifest
 */
export function generateOpenAPI(manifest: Manifest): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: "3.0.0",
    info: {
      title: manifest.metadata?.name || "BaaS API",
      version: manifest.metadata?.version || "1.0.0",
      description: manifest.metadata?.description || "Auto-generated API",
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  if (!manifest.entities) {
    return spec;
  }

  // Generate schemas and paths for each entity
  for (const entity of manifest.entities) {
    const basePath = `/${entity.tableName || entity.name.toLowerCase()}`;

    // Generate schema
    if (spec.components?.schemas) {
      spec.components.schemas[entity.name] = generateEntitySchema(entity);
      spec.components.schemas[`${entity.name}Create`] =
        generateEntityCreateSchema(entity);
      spec.components.schemas[`${entity.name}Update`] =
        generateEntityUpdateSchema(entity);
    }

    // List endpoint
    spec.paths[basePath] = {
      get: {
        summary: `List ${entity.name} entities`,
        tags: [entity.name],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, maximum: 100 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: `#/components/schemas/${entity.name}` },
                    },
                    meta: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: `Create ${entity.name}`,
        tags: [entity.name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entity.name}Create` },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: `#/components/schemas/${entity.name}` },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    };

    // Single entity endpoints
    spec.paths[`${basePath}/{id}`] = {
      get: {
        summary: `Get ${entity.name} by ID`,
        tags: [entity.name],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: `#/components/schemas/${entity.name}` },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not found",
          },
        },
      },
      patch: {
        summary: `Update ${entity.name}`,
        tags: [entity.name],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entity.name}Update` },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: `#/components/schemas/${entity.name}` },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not found",
          },
        },
      },
      delete: {
        summary: `Delete ${entity.name}`,
        tags: [entity.name],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
          "404": {
            description: "Not found",
          },
        },
      },
    };
  }

  return spec;
}

function generateEntitySchema(entity: {
  name: string;
  fields: EntityField[];
}): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of entity.fields) {
    properties[field.name] = generateFieldSchema(field);
    if (field.required || field.primary) {
      required.push(field.name);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function generateEntityCreateSchema(entity: {
  name: string;
  fields: EntityField[];
}): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of entity.fields) {
    // Skip auto-generated fields
    if (field.generated || field.name === "id") {
      continue;
    }

    properties[field.name] = generateFieldSchema(field);
    if (field.required && !field.default) {
      required.push(field.name);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function generateEntityUpdateSchema(entity: {
  name: string;
  fields: EntityField[];
}): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  for (const field of entity.fields) {
    // Skip auto-generated and primary key fields
    if (field.generated || field.primary || field.name === "id") {
      continue;
    }

    properties[field.name] = generateFieldSchema(field);
  }

  return {
    type: "object",
    properties,
  };
}

function generateFieldSchema(field: EntityField): Record<string, unknown> {
  const schema: Record<string, unknown> = {};

  switch (field.type) {
    case "uuid":
    case "string":
    case "text":
    case "richtext":
    case "file":
      schema["type"] = "string";
      if (field.maxLength) {
        schema["maxLength"] = field.maxLength;
      }
      if (field.minLength) {
        schema["minLength"] = field.minLength;
      }
      if (field.validation === "email") {
        schema["format"] = "email";
      }
      if (field.validation === "url") {
        schema["format"] = "uri";
      }
      if (field.type === "uuid") {
        schema["format"] = "uuid";
      }
      break;

    case "integer":
      schema["type"] = "integer";
      if (field.min !== undefined) {
        schema["minimum"] = field.min;
      }
      if (field.max !== undefined) {
        schema["maximum"] = field.max;
      }
      break;

    case "decimal":
    case "float":
      schema["type"] = "number";
      if (field.min !== undefined) {
        schema["minimum"] = field.min;
      }
      if (field.max !== undefined) {
        schema["maximum"] = field.max;
      }
      break;

    case "boolean":
      schema["type"] = "boolean";
      break;

    case "enum":
      schema["type"] = "string";
      if (field.values && field.values.length > 0) {
        schema["enum"] = field.values;
      }
      break;

    case "timestamp":
    case "date":
    case "datetime":
      schema["type"] = "string";
      schema["format"] = "date-time";
      break;

    case "json":
      schema["type"] = "object";
      break;

    default:
      schema["type"] = "string";
  }

  if (field.description) {
    schema["description"] = field.description;
  }

  if (field.default !== undefined) {
    schema["default"] = field.default;
  }

  return schema;
}
