import { z } from "zod";

export interface EntityField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  values?: string[];
  default?: unknown;
  sensitive?: boolean;
  validation?: string;
  references?: string;
}

export interface EntityDefinition {
  name: string;
  tableName: string;
  fields: EntityField[];
  policies?: {
    list?: string;
    get?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class EntityValidator {
  private readonly entity: EntityDefinition;

  constructor(entity: EntityDefinition) {
    this.entity = entity;
  }

  buildCreateSchema(): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const field of this.entity.fields) {
      if (
        field.name === "id" ||
        field.name === "createdAt" ||
        field.name === "updatedAt"
      ) {
        continue;
      }

      if (field.sensitive) {
        continue;
      }

      shape[field.name] = this.buildFieldSchema(field, "create");
    }

    return z.object(shape);
  }

  buildUpdateSchema(): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const field of this.entity.fields) {
      if (
        field.name === "id" ||
        field.name === "createdAt" ||
        field.name === "updatedAt"
      ) {
        continue;
      }

      if (field.sensitive) {
        continue;
      }

      shape[field.name] = this.buildFieldSchema(field, "update").optional();
    }

    return z.object(shape);
  }

  buildFilterSchema(): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const field of this.entity.fields) {
      if (field.sensitive) {
        continue;
      }

      shape[field.name] = this.buildFieldSchema(field, "filter").optional();
    }

    shape["limit"] = z.number().int().min(1).max(100).optional();
    shape["offset"] = z.number().int().min(0).optional();
    shape["orderBy"] = z.string().optional();
    shape["orderDirection"] = z.enum(["asc", "desc"]).optional();

    return z.object(shape);
  }

  private buildFieldSchema(
    field: EntityField,
    mode: "create" | "update" | "filter",
  ): z.ZodTypeAny {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case "string":
        schema = z.string();
        if (field.maxLength) {
          schema = (schema as z.ZodString).max(
            field.maxLength,
            `${field.name} must be at most ${field.maxLength} characters`,
          );
        }
        if (field.minLength) {
          schema = (schema as z.ZodString).min(
            field.minLength,
            `${field.name} must be at least ${field.minLength} characters`,
          );
        }
        if (field.pattern) {
          schema = (schema as z.ZodString).regex(
            new RegExp(field.pattern),
            `${field.name} format is invalid`,
          );
        }
        if (field.validation === "email") {
          schema = (schema as z.ZodString).email(
            `${field.name} must be a valid email`,
          );
        }
        if (field.validation === "url") {
          schema = (schema as z.ZodString).url(
            `${field.name} must be a valid URL`,
          );
        }
        break;

      case "text":
        schema = z.string();
        break;

      case "integer":
        schema = z.number().int(`${field.name} must be an integer`);
        if (field.min !== undefined) {
          schema = (schema as z.ZodNumber).min(
            field.min,
            `${field.name} must be at least ${field.min}`,
          );
        }
        if (field.max !== undefined) {
          schema = (schema as z.ZodNumber).max(
            field.max,
            `${field.name} must be at most ${field.max}`,
          );
        }
        break;

      case "decimal":
      case "float":
        schema = z.number();
        if (field.min !== undefined) {
          schema = (schema as z.ZodNumber).min(
            field.min,
            `${field.name} must be at least ${field.min}`,
          );
        }
        if (field.max !== undefined) {
          schema = (schema as z.ZodNumber).max(
            field.max,
            `${field.name} must be at most ${field.max}`,
          );
        }
        break;

      case "boolean":
        schema = z.boolean();
        break;

      case "enum":
        if (!field.values || field.values.length === 0) {
          schema = z.string();
        } else {
          schema = z.enum(field.values as [string, ...string[]], {
            message: `${field.name} must be one of: ${field.values.join(", ")}`,
          });
        }
        break;

      case "uuid":
        schema = z.string().uuid(`${field.name} must be a valid UUID`);
        break;

      case "timestamp":
      case "date":
        schema = z
          .union([z.string().datetime(), z.date()])
          .transform((val) => (typeof val === "string" ? new Date(val) : val));
        break;

      case "json":
        schema = z.union([
          z.record(z.string(), z.unknown()),
          z.array(z.unknown()),
        ]);
        break;

      default:
        schema = z.unknown();
    }

    if (mode === "create" && field.required && !field.default) {
      return schema;
    }

    if (mode === "create" && field.default !== undefined) {
      return schema.optional().default(field.default);
    }

    return schema.optional();
  }

  validateCreate<T = unknown>(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; errors: ValidationError[] } {
    const schema = this.buildCreateSchema();
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data as T };
    }

    return {
      success: false,
      errors: result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }

  validateUpdate<T = unknown>(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; errors: ValidationError[] } {
    const schema = this.buildUpdateSchema();
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data as T };
    }

    return {
      success: false,
      errors: result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }

  validateFilter<T = unknown>(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; errors: ValidationError[] } {
    const schema = this.buildFilterSchema();
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data as T };
    }

    return {
      success: false,
      errors: result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }
}

export interface RBACRule {
  resource: string;
  action: string;
  condition?: string;
}

export interface RBACPolicy {
  role: string;
  rules: RBACRule[];
}

export class RBACValidator {
  private readonly policies: Map<string, RBACPolicy> = new Map();

  addPolicy(policy: RBACPolicy): void {
    this.policies.set(policy.role, policy);
  }

  hasPermission(
    role: string,
    resource: string,
    action: string,
    context?: Record<string, unknown>,
  ): boolean {
    const policy = this.policies.get(role);
    if (!policy) {
      return false;
    }

    const rule = policy.rules.find(
      (r) => r.resource === resource && r.action === action,
    );

    if (!rule) {
      return false;
    }

    if (!rule.condition) {
      return true;
    }

    return this.evaluateCondition(rule.condition, context);
  }

  private evaluateCondition(
    condition: string,
    context?: Record<string, unknown>,
  ): boolean {
    if (!context) {
      return false;
    }

    if (condition === "owner") {
      return context["isOwner"] === true;
    }

    if (condition === "authenticated") {
      return context["userId"] !== undefined;
    }

    if (condition === "public") {
      return true;
    }

    if (condition.startsWith("role:")) {
      const requiredRole = condition.substring(5);
      return context["role"] === requiredRole;
    }

    if (condition.includes("||")) {
      const parts = condition.split("||").map((p) => p.trim());
      return parts.some((part) => this.evaluateCondition(part, context));
    }

    if (condition.includes("&&")) {
      const parts = condition.split("&&").map((p) => p.trim());
      return parts.every((part) => this.evaluateCondition(part, context));
    }

    return false;
  }
}

export function createEntityValidator(
  entity: EntityDefinition,
): EntityValidator {
  return new EntityValidator(entity);
}

export function createRBACValidator(policies?: RBACPolicy[]): RBACValidator {
  const validator = new RBACValidator();
  if (policies) {
    for (const policy of policies) {
      validator.addPolicy(policy);
    }
  }
  return validator;
}

export type InferCreateSchema = z.infer<
  ReturnType<EntityValidator["buildCreateSchema"]>
>;
export type InferUpdateSchema = z.infer<
  ReturnType<EntityValidator["buildUpdateSchema"]>
>;
export type InferFilterSchema = z.infer<
  ReturnType<EntityValidator["buildFilterSchema"]>
>;
