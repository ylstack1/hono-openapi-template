import type { Manifest } from "@baas-workers/usecore";

import { existsSync, readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";

/**
 * Auto-detect and load config from various sources
 */
export async function loadConfig(): Promise<Manifest> {
  // 1. Check config.ts (TypeScript - primary)
  if (existsSync("./config.ts")) {
    const imported = await import("../config.js");
    console.log("✅ Loaded config from config.ts");
    return imported.default as Manifest;
  }

  // 2. Check manifest.yaml
  if (existsSync("./manifest.yaml")) {
    const content = readFileSync("./manifest.yaml", "utf-8");
    const config = parseYaml(content);
    console.log("✅ Loaded config from manifest.yaml");
    return config as Manifest;
  }

  // 3. Check manifest.json
  if (existsSync("./manifest.json")) {
    const content = readFileSync("./manifest.json", "utf-8");
    const config = JSON.parse(content);
    console.log("✅ Loaded config from manifest.json");
    return config as Manifest;
  }

  // 4. Check config.json
  if (existsSync("./config.json")) {
    const content = readFileSync("./config.json", "utf-8");
    const config = JSON.parse(content);
    console.log("✅ Loaded config from config.json");
    return config as Manifest;
  }

  throw new Error(
    "❌ No config found (config.ts, manifest.yaml, manifest.json, or config.json)",
  );
}

/**
 * Validate config structure
 */
export function validateConfig(config: Manifest): boolean {
  const errors: string[] = [];

  if (!config.metadata?.name) {
    errors.push("metadata.name required");
  }

  if (!Array.isArray(config.entities)) {
    errors.push("entities must be array");
  }

  config.entities?.forEach((entity, idx) => {
    if (!entity.name) {
      errors.push(`Entity ${idx}: name required`);
    }

    if (!Array.isArray(entity.fields)) {
      errors.push(`Entity ${entity.name}: fields must be array`);
    }

    entity.fields?.forEach((field) => {
      if (!field.name) {
        errors.push(`Field missing name in ${entity.name}`);
      }

      if (!field.type) {
        errors.push(`Field ${field.name} missing type in ${entity.name}`);
      }
    });
  });

  if (errors.length > 0) {
    console.error("❌ Config validation errors:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    throw new Error("Invalid config");
  }

  console.log("✅ Config valid");
  return true;
}
