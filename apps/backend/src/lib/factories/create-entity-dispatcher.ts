import {
  CREATED_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  NO_CONTENT_CODE,
  OK_CODE,
  UNPROCESSABLE_ENTITY_CODE,
} from "http-stash";

import type { AppRouteHandler } from "@/types";

/**
 * Create a catch-all handler that dispatches entity requests to the engine
 * Supports: GET /api/:entity, POST /api/:entity, GET /api/:entity/:id, PATCH /api/:entity/:id, DELETE /api/:entity/:id
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEntityDispatchHandler(): AppRouteHandler<any> {
  return async (c) => {
    const engine = c.get("engine");
    const logger = c.get("logger");

    if (!engine) {
      return c.json(
        { error: "Engine not initialized" },
        INTERNAL_SERVER_ERROR_CODE,
      );
    }

    const path = c.req.path;
    const method = c.req.method;

    // Parse path: /api/:entity or /api/:entity/:id
    const segments = path.split("/").filter(Boolean);

    // Handle /api/entities
    if (segments.length < 2) {
      return c.json({ error: "Invalid API path" }, 400);
    }

    const entityName = segments[1];
    // Handle both route params and path parsing
    const entityId = c.req.param("id") || segments[2];

    // Get entity config from engine
    const entityConfig = engine.getEntityConfig(entityName);
    if (!entityConfig) {
      return c.json({ error: `Entity ${entityName} not found` }, 404);
    }

    const { validator } = entityConfig;
    const policyEvaluator = engine.getPolicyEvaluator();

    // Check authentication if required
    let userId: string | undefined;
    const jwtPayload = c.get("jwtPayload");
    if (jwtPayload) {
      userId = jwtPayload.sub;
    }

    // Try to get user ID from current user if available
    const currentUser = c.get("currentUser");
    if (currentUser && typeof currentUser === "object" && "id" in currentUser) {
      const user = currentUser as Record<string, unknown>;
      userId = String(user["id"]);
    }

    try {
      switch (method) {
        case "GET": {
          // GET /api/:entity or GET /api/:entity/:id
          if (entityId) {
            // Get single entity
            const canGet = policyEvaluator.canGet(entityName, {
              userId,
              isOwner: false,
            });

            if (!canGet) {
              return c.json({ error: "Not allowed to get this entity" }, 403);
            }

            // TODO: Fetch from database using D1Client
            return c.json(
              {
                id: entityId,
                message: "Entity retrieval not yet implemented",
              },
              OK_CODE,
            );
          } else {
            // List entities
            const canList = policyEvaluator.canList(entityName, {
              userId,
              isOwner: false,
            });

            if (!canList) {
              return c.json({ error: "Not allowed to list this entity" }, 403);
            }

            // TODO: Fetch from database with pagination
            return c.json([], OK_CODE);
          }
        }

        case "POST": {
          // POST /api/:entity - Create entity
          if (entityId) {
            return c.json({ error: "Cannot POST to entity with ID" }, 400);
          }

          const canCreate = policyEvaluator.canCreate(entityName, {
            userId,
            isOwner: false,
          });

          if (!canCreate) {
            return c.json({ error: "Not allowed to create this entity" }, 403);
          }

          let body: Record<string, unknown> = {};
          try {
            body = await c.req.json();
          } catch {
            // Body parsing failed, continue with empty object
          }

          // Validate input
          const createSchema = validator.buildCreateSchema();
          const validationResult = createSchema.safeParse(body as unknown);

          if (!validationResult.success) {
            return c.json(
              {
                errors: validationResult.error.issues.map((issue) => ({
                  field: (issue.path || []).join(".") || "root",
                  message: issue.message,
                  code: issue.code,
                })),
              },
              UNPROCESSABLE_ENTITY_CODE,
            );
          }

          // TODO: Insert into database
          return c.json(validationResult.data, CREATED_CODE);
        }

        case "PATCH": {
          // PATCH /api/:entity/:id - Update entity
          if (!entityId) {
            return c.json({ error: "Entity ID required for PATCH" }, 400);
          }

          const canUpdate = policyEvaluator.canUpdate(entityName, {
            userId,
            isOwner: false,
          });

          if (!canUpdate) {
            return c.json({ error: "Not allowed to update this entity" }, 403);
          }

          let body: Record<string, unknown> = {};
          try {
            body = await c.req.json();
          } catch {
            // Body parsing failed, continue with empty object
          }

          // Validate input
          const updateSchema = validator.buildUpdateSchema();
          const validationResult = updateSchema.safeParse(body as unknown);

          if (!validationResult.success) {
            return c.json(
              {
                errors: validationResult.error.issues.map((issue) => ({
                  field: (issue.path || []).join(".") || "root",
                  message: issue.message,
                  code: issue.code,
                })),
              },
              UNPROCESSABLE_ENTITY_CODE,
            );
          }

          // TODO: Update in database
          return c.json(validationResult.data, OK_CODE);
        }

        case "DELETE": {
          // DELETE /api/:entity/:id - Delete entity
          if (!entityId) {
            return c.json({ error: "Entity ID required for DELETE" }, 400);
          }

          const canDelete = policyEvaluator.canDelete(entityName, {
            userId,
            isOwner: false,
          });

          if (!canDelete) {
            return c.json({ error: "Not allowed to delete this entity" }, 403);
          }

          // TODO: Delete from database
          return c.body(null, NO_CONTENT_CODE);
        }

        default:
          return c.json({ error: "Method not allowed" }, 405);
      }
    } catch (error: unknown) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        `Failed to handle ${method} /api/${entityName}`,
      );
      return c.json(
        {
          error: "Internal Server Error",
          message: `Failed to process ${method} request`,
        },
        INTERNAL_SERVER_ERROR_CODE,
      );
    }
  };
}
