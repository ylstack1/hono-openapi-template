import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { loadConfig, validateConfig } from "./config-loader";
import { setupDatabase } from "./db-setup";

/**
 * Application entry point
 */
async function start() {
  console.log("\n🚀 Starting baas-workers app...\n");

  try {
    // 1. Load config (auto-detects config.ts, manifest.yaml, etc.)
    const config = await loadConfig();
    console.log(`📝 App: ${config.metadata?.name || "Unknown"}\n`);

    // 2. Validate config
    validateConfig(config);

    // 3. Setup database (auto-migrate if needed)
    await setupDatabase(config);

    // 4. Create server (from usecore)
    const app = createApp(config);

    // 5. Start server
    const port = Number.parseInt(process.env["PORT"] || "3000");
    console.log("✅ Server ready:\n");
    console.log(`   Home:  http://localhost:${port}/`);
    console.log(`   API:   http://localhost:${port}/api`);
    console.log(`   Docs:  http://localhost:${port}/docs`);
    console.log(`   Admin: http://localhost:${port}/admin\n`);

    serve({ fetch: app.fetch, port });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

start();
