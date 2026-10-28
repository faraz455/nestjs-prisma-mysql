---
name: api-tests
description: Writes unit and HTTP tests for this NestJS API. Use when adding, changing, or reviewing tests, specs, e2e coverage, Jest, or supertest.
---

# API tests

Two layers. Both run without MySQL and without reading `.env` or `env.conf`.

| Layer | Files | Command | Proves |
| --- | --- | --- | --- |
| Unit | `src/**/*.spec.ts` | `yarn test` | A function, service query, or guard branch |
| HTTP | `test/**/*.e2e-spec.ts` | `yarn test:e2e` | Status, auth, validation, and the response shape |

`yarn test:all` runs both. `yarn lint` covers `src` and `test`.

## When a route changes

1. Read the controller method, its guards, and the service method.
2. Add or extend the service spec for each branch: missing optional keys, empty arrays, `false` booleans, and the Prisma `select` / `where`.
3. Add HTTP cases for that route:
   - no token → `401` when `CustomJwtGuard` is applied
   - wrong role → `403`
   - missing permission flag → `403` when the route declares `@Permissions`
   - invalid body or query → `400`
   - missing row → `404` with `statusCode` from `PrismaClientExceptionFilter`
   - unique or foreign-key failure → `409` and the filter message
   - success → status and the fields the entity or `IDDto` names, and no `password`
4. A `POST` without `@HttpCode` is `201`. `@HttpCode(HttpStatus.OK)` is `200`.

Guards run before the validation pipe. A bad password fails in `LoginGuard` even if the body also has an unknown field.

## Unit specs

Construct the class. Pass a Prisma double whose methods are `jest.fn()`. Do not boot Nest and do not construct `PrismaService`.

```typescript
const db = { article: { create: jest.fn() } };
const service = new ArticlesService(db as never);
```

Assert the argument the service passes to Prisma, including `select` that omits `password`. Name the test for the behavior: `rejects a token issued for another tenant`.

Reference specs:

- `src/articles/articles.service.spec.ts`
- `src/auth/auth.service.spec.ts`
- `src/auth/guards/custom-jwt.guard.spec.ts`
- `src/common/dto/http-validation.spec.ts`
- `src/prisma/prisma-client-exception.filter.spec.ts`

DTO shape that does not need a server uses `new ValidationPipe(httpValidationOptions)` from `src/bootstrap/apply-http-defaults.ts`. One HTTP test per area still proves the app installs that pipe.

## HTTP tests

Boot with `createTestApp()` and close with `closeTestApp()`. Call `seedTenant(prisma)` in `beforeEach` so rows do not leak. Supertest's host is `127.0.0.1`, which `getHost` rewrites to `localhost:3000`. The factory puts the in-memory client on that key before the app listens. `GET /health` does not resolve a tenant. Any other unknown host is `404` `Tenant not found`.

Login with `loginAs(app, username)` from `test/support/http.ts`. The seeded password is `password` in `test/support/seed.ts`. Roles:

- `super` is `SUPER ADMIN` with every Article flag
- `admin` is `ADMIN` with `Article.view` only
- `editor` has every Article flag and is rejected by `@Roles`
- `plain` has no role

Send another tenant with `.set('Host', OTHER_HOST)`. Do not let a test call `PrismaService.initService`. `closeTestApp` fails the file if a pool was opened.

The in-memory client in `test/support/memory-prisma.ts` implements the calls the services make and rolls back a failed `$transaction`. It throws `P2025`, `P2002`, and `P2003` so the real filter runs. It is not MySQL: no collation, no `CHAR` padding, no `VARCHAR` width. When a service calls a new Prisma shape, add that shape and throw a clear error for arguments the double does not understand.

Reference: `test/articles/articles.e2e-spec.ts`, `test/auth/auth.e2e-spec.ts`, `test/admin/admin.e2e-spec.ts`, `test/tenancy/tenancy.e2e-spec.ts`.

A new feature gets its own folder under `test/`, named like the module: `test/orders/orders.e2e-spec.ts`. Shared setup stays in `test/support/`. Do not add a second copy of the app factory inside a feature folder.

## Do not

- Read or print `.env`, `env.conf`, `JWT_SECRET`, or `AUTH_COOKIE_SECRET`. HTTP tests set their own values in `test/setup-env.ts`.
- Snapshot a response body.
- Mock the service inside an HTTP test. The point is the real controller, guards, pipe, and filter.
- Start `main.ts` or mount Swagger. `PRODUCTION=1` in the HTTP setup.
- Assert a stack trace or a raw Prisma validation message. The filter hides that text.
