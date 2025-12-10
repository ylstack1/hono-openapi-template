import type { EntityDefinition, EntityField } from "@baas-workers/usecore";

import { z } from "zod";

export function createFieldSchema(field: EntityField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  // Skip generated and sensitive fields
  if (field.generated || field.sensitive) {
    return z.any().optional();
  }

  switch (field.type) {
    case "string":
    case "text":
      schema = z.string();
      if (field.validation === "email") {
        schema = z.string().email();
      } else if (field.maxLength) {
        schema = z.string().max(field.maxLength);
      }
      if (field.minLength) {
        schema = z.string().min(field.minLength);
      }
      break;

    case "integer":
      schema = z.number().int();
      if (field.min !== undefined) {
        schema = z.number().int().min(field.min);
      }
      if (field.max !== undefined) {
        schema = z.number().int().max(field.max);
      }
      break;

    case "decimal":
    case "number":
      schema = z.number();
      if (field.min !== undefined) {
        schema = z.number().min(field.min);
      }
      if (field.max !== undefined) {
        schema = z.number().max(field.max);
      }
      break;

    case "boolean":
      schema = z.boolean();
      break;

    case "date":
    case "datetime":
    case "timestamp":
      schema = z.string().datetime().or(z.date());
      break;

    case "enum":
      if (field.values && field.values.length > 0) {
        schema = z.enum(field.values as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;

    case "uuid":
      schema = z.string().uuid();
      break;

    case "file":
    case "image":
      schema = z.string().url().or(z.instanceof(File));
      break;

    default:
      schema = z.string();
  }

  // Apply required/optional
  if (!field.required && field.default === undefined) {
    schema = schema.optional();
  }

  // Apply default value
  if (field.default !== undefined) {
    schema = schema.default(field.default);
  }

  return schema;
}

export function createEntitySchema(
  entity: EntityDefinition,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of entity.fields) {
    // Skip primary key and generated fields in create/edit forms
    if (field.primary || field.generated) continue;

    shape[field.name] = createFieldSchema(field);
  }

  return z.object(shape);
}

export function getFieldLabel(field: EntityField): string {
  return (
    field.description ||
    field.name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
}

export function getFieldPlaceholder(field: EntityField): string {
  switch (field.type) {
    case "email":
      return "user@example.com";
    case "string":
      return `Enter ${field.name}`;
    case "text":
      return `Enter ${field.name}...`;
    case "number":
    case "integer":
    case "decimal":
      return "0";
    case "date":
      return "YYYY-MM-DD";
    case "datetime":
    case "timestamp":
      return "YYYY-MM-DD HH:MM:SS";
    case "uuid":
      return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    default:
      return `Enter ${field.name}`;
  }
}

export function shouldShowField(
  field: EntityField,
  mode: "create" | "edit" | "view",
): boolean {
  // Never show sensitive fields
  if (field.sensitive) return false;

  // Never show generated fields in create/edit
  if (mode !== "view" && field.generated) return false;

  // Show primary key only in view mode
  if (field.primary && mode !== "view") return false;

  return true;
}

export function isRelationField(field: EntityField): boolean {
  return Boolean(field.references);
}

export function getRelatedEntityName(field: EntityField): string | null {
  if (!field.references) return null;
  const parts = field.references.split(".");
  return parts[0] ?? null;
}
