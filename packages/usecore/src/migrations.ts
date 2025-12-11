import type { Manifest } from "./engine";
import type { EntityField } from "./validation";

/**
 * Generate SQL migrations from manifest configuration
 */
export function generateMigrations(manifest: Manifest): string {
  if (!manifest.entities || manifest.entities.length === 0) {
    return "-- No entities defined\n";
  }

  const statements: string[] = [];

  // Add header
  statements.push("-- Auto-generated migration");
  statements.push(`-- App: ${manifest.metadata?.name || "Unknown"}`);
  statements.push(`-- Generated: ${new Date().toISOString()}`);
  statements.push("");

  // Create tables for each entity
  for (const entity of manifest.entities) {
    const tableName = entity.tableName || entity.name.toLowerCase();
    const columns: string[] = [];

    for (const field of entity.fields) {
      const columnDef = generateColumnDefinition(field);
      if (columnDef) {
        columns.push(`  ${columnDef}`);
      }
    }

    statements.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
    statements.push(columns.join(",\n"));
    statements.push(");");
    statements.push("");

    // Create indexes for unique fields
    for (const field of entity.fields) {
      if (field.unique && field.name !== "id") {
        statements.push(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_${field.name} ON ${tableName}(${field.name});`,
        );
      }
    }

    // Create indexes for foreign keys
    for (const field of entity.fields) {
      if (field.references) {
        statements.push(
          `CREATE INDEX IF NOT EXISTS idx_${tableName}_${field.name} ON ${tableName}(${field.name});`,
        );
      }
    }

    if (
      entity.fields.some((f) => f.unique || f.references) &&
      entity.fields.length > 0
    ) {
      statements.push("");
    }
  }

  return statements.join("\n");
}

function generateColumnDefinition(field: EntityField): string {
  const parts: string[] = [field.name];

  // Type mapping
  const sqlType = mapFieldTypeToSQL(field);
  parts.push(sqlType);

  // Primary key
  if (field.primary) {
    parts.push("PRIMARY KEY");
  }

  // Not null
  if (field.required && !field.primary) {
    parts.push("NOT NULL");
  }

  // Default value
  if (field.default !== undefined && !field.generated) {
    if (typeof field.default === "string") {
      parts.push(`DEFAULT '${field.default}'`);
    } else if (typeof field.default === "boolean") {
      parts.push(`DEFAULT ${field.default ? 1 : 0}`);
    } else {
      parts.push(`DEFAULT ${field.default}`);
    }
  }

  // Auto-generated timestamps
  if (field.name === "createdAt" && field.generated) {
    parts.push("DEFAULT CURRENT_TIMESTAMP");
  }

  return parts.join(" ");
}

function mapFieldTypeToSQL(field: EntityField): string {
  switch (field.type) {
    case "uuid":
      return "TEXT";
    case "string":
      if (field.maxLength && field.maxLength <= 255) {
        return `TEXT`;
      }
      return "TEXT";
    case "text":
      return "TEXT";
    case "integer":
      return "INTEGER";
    case "decimal":
    case "float":
      return "REAL";
    case "boolean":
      return "INTEGER"; // SQLite uses INTEGER for boolean (0/1)
    case "enum":
      return "TEXT";
    case "timestamp":
    case "date":
    case "datetime":
      return "TEXT"; // SQLite stores dates as TEXT
    case "json":
      return "TEXT"; // SQLite stores JSON as TEXT
    case "file":
      return "TEXT"; // Store file path/URL
    case "richtext":
      return "TEXT";
    default:
      return "TEXT";
  }
}

/**
 * Generate TypeScript types from manifest
 */
export function generateTypes(manifest: Manifest): string {
  if (!manifest.entities || manifest.entities.length === 0) {
    return "";
  }

  const types: string[] = [];

  types.push("// Auto-generated types from manifest");
  types.push("");

  for (const entity of manifest.entities) {
    types.push(`export interface ${entity.name} {`);

    for (const field of entity.fields) {
      const tsType = mapFieldTypeToTypeScript(field);
      const optional = !field.required && !field.primary ? "?" : "";
      types.push(`  ${field.name}${optional}: ${tsType};`);
    }

    types.push("}");
    types.push("");
  }

  return types.join("\n");
}

function mapFieldTypeToTypeScript(field: EntityField): string {
  switch (field.type) {
    case "uuid":
    case "string":
    case "text":
    case "richtext":
    case "file":
      return "string";
    case "integer":
    case "decimal":
    case "float":
      return "number";
    case "boolean":
      return "boolean";
    case "enum":
      if (field.values && field.values.length > 0) {
        return field.values.map((v) => `'${v}'`).join(" | ");
      }
      return "string";
    case "timestamp":
    case "date":
    case "datetime":
      return "string | Date";
    case "json":
      return "Record<string, unknown> | unknown[]";
    default:
      return "unknown";
  }
}
