# Testing Guide

This guide covers how to test the BaaS Workers backend, ensuring functionality, security, and performance.

## Unit Tests

Run unit tests to verify individual components like the D1 client, Auth client, and Policy engine.

```bash
pnpm test
```

### Key Areas Tested

- **D1 Client:** Verifies parameterized queries and SQL injection protection.
- **Auth:** Tests login, token generation, refresh flow, and password hashing.
- **Policy:** Checks RBAC logic and policy evaluation.
- **Utils:** Validates helper functions for R2, KV, etc.

## Integration Testing (Local)

You can test the full API flow locally using `curl` or Postman against the running Worker.

1. Start the dev server:

   ```bash
   pnpm dev
   ```

2. Run migrations and seed data:
   ```bash
   pnpm db:migrate:local
   pnpm db:seed:local
   ```

### Example Test Flows

#### Authentication

```bash
# Register/Login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "password": "password123"}'

# Refresh Token
curl -X POST http://localhost:8787/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

#### Entity CRUD

```bash
# List Stores
curl http://localhost:8787/api/stores

# Create Store (Authenticated)
curl -X POST http://localhost:8787/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Store", "ownerId": "USER_UUID"}'
```

## Manual Verification Checklist

- [ ] **Auth:** Verify login returns valid JWTs and refresh tokens work.
- [ ] **RBAC:** Verify users cannot access resources they don't own (unless policy allows).
- [ ] **Validation:** Verify invalid inputs return 422 Unprocessable Entity with `issues` array.
- [ ] **Persistence:** Verify created entities persist after server restart (D1).

## Security Testing

- **SQL Injection:** All DB queries must use `drizzle-orm` builders or parameterized statements.
- **XSS:** Ensure API outputs are JSON and proper Content-Type headers are set.
- **Rate Limiting:** Verify excessive requests are blocked (if configured).
- **JWT:** Ensure tokens expire and signature verification is enforced.
