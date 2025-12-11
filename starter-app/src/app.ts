import {
  createManifestRouter,
  generateOpenAPI,
  type Manifest,
} from "@baas-workers/usecore";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

/**
 * Create the application
 * This uses usecore to generate everything from config
 */
export function createApp(config: Manifest): Hono {
  const app = new Hono();

  // ============================================
  // THAT'S IT! Everything from usecore
  // ============================================

  // 1. Middleware
  app.use(logger());
  app.use(cors());

  // 2. API routes (usecore creates them from config)
  const apiRouter = createManifestRouter(config);
  app.route("/api", apiRouter);

  // 3. OpenAPI spec (usecore generates it)
  const openapi = generateOpenAPI(config);
  app.get("/openapi.json", (c) => c.json(openapi));

  // 4. Docs (Swagger UI)
  app.get("/docs", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Docs - ${config.metadata?.name || "BaaS App"}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            window.onload = function() {
              SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
              })
            }
          </script>
        </body>
      </html>
    `);
  });

  // 5. Admin panel placeholder (could integrate @baas-workers/admin)
  app.get("/admin", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Admin - ${config.metadata?.name || "BaaS App"}</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 80px auto;
              padding: 20px;
              text-align: center;
            }
            h1 { color: #4f46e5; }
            code {
              background: #f3f4f6;
              padding: 2px 8px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h1>🚀 ${config.metadata?.name || "BaaS App"}</h1>
          <p>Admin UI can be integrated using <code>@baas-workers/admin</code></p>
          <p>For now, use the <a href="/docs">API Docs</a> to explore the API.</p>
        </body>
      </html>
    `);
  });

  // 6. Health check
  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      app: config.metadata?.name || "BaaS App",
      version: config.metadata?.version || "1.0.0",
    });
  });

  // 7. Root - show app info
  app.get("/", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${config.metadata?.name || "BaaS App"}</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 80px auto;
              padding: 20px;
            }
            h1 { color: #4f46e5; }
            .links { margin: 40px 0; }
            .links a {
              display: inline-block;
              margin: 10px;
              padding: 12px 24px;
              background: #4f46e5;
              color: white;
              text-decoration: none;
              border-radius: 8px;
            }
            .links a:hover { background: #4338ca; }
            .entities {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .entities ul { list-style: none; padding: 0; }
            .entities li {
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            code {
              background: #f3f4f6;
              padding: 2px 8px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h1>🚀 ${config.metadata?.name || "BaaS App"}</h1>
          <p>${config.metadata?.description || "Backend-as-a-Service application"}</p>
          <p><strong>Version:</strong> ${config.metadata?.version || "1.0.0"}</p>

          <div class="links">
            <a href="/docs">📚 API Docs</a>
            <a href="/admin">⚙️ Admin</a>
            <a href="/openapi.json">📄 OpenAPI Spec</a>
          </div>

          <div class="entities">
            <h2>Entities</h2>
            <ul>
              ${
                config.entities
                  ?.map(
                    (e) =>
                      `<li><strong>${e.name}</strong> - <code>/api/${e.tableName || e.name.toLowerCase()}</code></li>`,
                  )
                  .join("") || "<li>No entities defined</li>"
              }
            </ul>
          </div>

          <p><small>Built with <a href="https://github.com/yourusername/baas-workers">baas-workers</a></small></p>
        </body>
      </html>
    `);
  });

  return app;
}
