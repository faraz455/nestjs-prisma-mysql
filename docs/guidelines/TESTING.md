# Testing

Unit specs and HTTP tests both run without MySQL. They do not read `.env` or `env.conf`.

```bash
yarn test
yarn test:e2e
yarn test:all
yarn test:cov
yarn lint
yarn lint:check
```

`yarn test` runs `src/**/*.spec.ts`. `yarn test:e2e` runs `test/**/*.e2e-spec.ts`. Node must be 20.19, 22.12, or newer.

`yarn lint` fixes what ESLint can fix. `yarn lint:check` reports the same problems and leaves the files alone. The push pipeline uses `lint:check`.

`yarn test:cov` runs both suites and merges the coverage. It fails when the combined report drops below 88% statements, 84% branches, 87% functions, or 88% lines. `src/main.ts` stays in that report. The HTTP tests boot the app through `createTestApp`, so the process entry in `main.ts` is the part this gate does not execute.

## What each layer owns

A unit spec constructs the class and passes a double. It checks a branch: the Prisma `where` and `select`, a guard decision, a DTO rejection, or a filter status. It does not listen on a port.

An HTTP test boots `AppModule` through `createTestApp()` in `test/support/create-test-app.ts`. The request goes through the tenant middleware, guards, validation pipe, controller, service, and `PrismaClientExceptionFilter`. Supertest calls `127.0.0.1`, and `getHost` rewrites that to `localhost:3000`. The factory places an in-memory client on that host before the first request, so `PrismaService` never opens a pool. `closeTestApp` fails the file if a pool was opened.

`GET /health` does not look up a tenant. Any other path on an unknown host is `404` with the message `Tenant not found`. A token from one host is rejected on another.

## Seeded callers

`seedTenant` in `test/support/seed.ts` resets the in-memory rows and inserts four users. The password for every one of them is `password`.

| Username | Role | Article flags |
| --- | --- | --- |
| `super` | `SUPER ADMIN` | all four |
| `admin` | `ADMIN` | `view` only |
| `editor` | `EDITOR` | all four, and not an admin role |
| `plain` | none | none |

`loginAs` returns the login body. Protected calls send `Authorization: Bearer` with `authToken`. Cookie names in the test tenant config are `Authentication` and `Refresh`.

## Status the tests expect

- Missing or invalid token: `401`.
- Role or permission denied: `403`.
- Unknown field, wrong type, or a string longer than the column: `400`.
- Missing row (`P2025`): `404`.
- Unique value or a foreign key that blocks the write (`P2002`, `P2003`): `409`. The message names the field, for example `title is already used`.
- `POST` with no `@HttpCode`: `201`. `@HttpCode(HttpStatus.OK)`: `200`.

Guards run before the validation pipe. A wrong password is `401` even when the body also contains an unknown field.

## Adding a test

Put a unit spec beside the source: `articles.service.ts` and `articles.service.spec.ts`. Put an HTTP test in a feature folder under `test/`, using the same name as the module: `test/articles/articles.e2e-spec.ts`. Tenancy stays in `test/tenancy/` because it crosses features. Call `seedTenant` in `beforeEach`. Import the shared harness from `test/support/`.

A changed route needs both. The service spec asserts the query. The HTTP spec asserts anonymous access, the forbidden role, the missing permission when the route has `@Permissions`, invalid input, the missing row, a conflict when the write can collide, and the success body. Success responses do not include `password`.

Name the test for the behavior, in the present tense. One behavior per test. Do not snapshot a body.

When a service starts calling a Prisma method the in-memory client does not implement, add that method in `test/support/memory-prisma.ts`. Throw a Prisma known error for a missing row, a duplicate unique value, or a blocked foreign key. The client rolls a failed `$transaction` back. It is not MySQL: it does not enforce collation, `CHAR` width, or `VARCHAR` length. String length belongs on the DTO and in `src/common/dto/http-validation.spec.ts`.

The procedure for an agent is `.cursor/skills/api-tests/SKILL.md`.

## On every push

`.github/workflows/ci.yml` runs on push and on a pull request. It installs dependencies, generates the Prisma client, then runs `yarn lint:check` and `yarn test:cov`. Generate reads `DATABASE_URL` and does not open MySQL. The workflow uses the sample URL from the README.
