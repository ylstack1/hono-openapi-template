import type { Manifest } from "@baas-workers/usecore";

import { generateMigrations } from "@baas-workers/usecore";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Setup database and auto-migrate
 */
export async function setupDatabase(config: Manifest): Promise<void> {
  console.log("📊 Setting up database...\n");

  const migrationsDir = "./migrations";

  // 1. Check if migrations exist
  if (existsSync(migrationsDir)) {
    const migrations = readdirSync(migrationsDir).filter((f) =>
      f.endsWith(".sql"),
    );

    console.log(`✅ Found ${migrations.length} migrations\n`);
    return;
  }

  // 2. Generate migrations from config (using usecore)
  console.log("🔨 Generating migrations from config...");
  const sql = generateMigrations(config);

  // 3. Write migration file
  mkdirSync(migrationsDir, { recursive: true });
  const timestamp = Date.now();
  const file = join(migrationsDir, `${timestamp}_init.sql`);
  writeFileSync(file, sql);
  console.log(`✅ Created: ${file}`);

  // 4. Apply migration for local SQLite
  console.log("⚙️  Applying migration to local database...");

  try {
    // Dynamic import sqlite3 (only for local dev)
    const sqlite3Module = await import("sqlite3");
    const sqlite3 = sqlite3Module.default;

    const dbPath = process.env["DATABASE_PATH"] || "./data/app.db";

    // Ensure directory exists
    const dbDir = dirname(dbPath);
    mkdirSync(dbDir, { recursive: true });

    const db = new sqlite3.Database(dbPath);

    await new Promise<void>((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          console.error("❌ Migration failed:", err);
          reject(err);
        } else {
          console.log("✅ Database ready\n");
          resolve();
        }
        db.close();
      });
    });
  } catch {
    console.warn(
      "⚠️  sqlite3 not available, skipping local DB setup (OK for Cloudflare Workers)",
    );
    console.log("✅ Migrations generated\n");
  }
}
