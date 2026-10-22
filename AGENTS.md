# Engineering philosophy

This repository is a production-shaped NestJS API: Prisma 5.18, MySQL, one process, many tenants. Articles is the reference feature. Auth is JWT in a signed cookie, with roles and resource permissions. The job of every agent is to extend that system without inventing a second one.

## The request path

A request moves in one direction.

1. `MultiTenantMiddleware` reads the host and attaches that tenant's Prisma client.
2. Guards authenticate, then authorize.
3. The global `ValidationPipe` transforms, whitelists, and rejects unknown fields.
4. The controller reads the DTO and calls the service.
5. The service queries MySQL through the request-scoped `PRISMA_SERVICE` client.
6. `PrismaClientExceptionFilter` turns Prisma errors into HTTP.
7. `RequestResponseInterceptor` logs only when `LOG_REQUESTS=1`.

New behavior enters at the layer that already owns it. Controllers stay thin. Services own queries. Middleware owns the tenant. Guards own access. The filter owns Prisma-to-HTTP mapping.

## Tenancy

`.env` `DATABASE_URL` is for the Prisma CLI and `yarn data:seed`. Request handling uses the `env.conf` section whose name is the host, for example `localhost:3000`. An unknown host is `404 Tenant not found`.

Services inject `@Inject(PRISMA_SERVICE)`. They do not construct `PrismaClient` and they do not read `DATABASE_URL` at request time.

## Identity and content

`prisma/schema/auth.prisma` holds users, roles, permissions, and refresh tokens. `prisma/schema/schema.prisma` holds the datasource and content models, starting with `Article`. A new content area gets its own model file in that folder when it is not auth.

Primary keys are `String @id @db.Char(40)`, created in services with `MakeTimedIDUnique()` from `src/common/common.helper.ts`. Required relations stay restrictive. Cascade deletes are a product decision, not a default.

Permissions are rows, not code. Role names live in the JWT and are compared as strings: `ADMIN` and `SUPER ADMIN`. A new resource is unfinished until all of these exist:

- a `ResourceName` entry in `src/auth/dto/permissions.ts`
- `@Permissions({ AND: ['Resource.action'] })` on the route
- seed rows in `prisma/seeding-helpers/permission.seed.ts`

Guard order on protected controllers is `CustomJwtGuard`, then `PermissionsGuard`, then `RolesGuards`.

## The API contract

DTO validators, `@ApiProperty({ required })`, TypeScript optionality, the entity, and the service return value describe the same shape. Optional strings use `IsCustomString({ required: false })`. Updates use `PartialType` and must tolerate missing keys. Creates, updates, and deletes return `IDDto`. Lists return `PaginatedResponseDto` via `getOffset` and `getPages`.

Static routes sit above routes with the same method and a path parameter. Swagger is mounted at `/swagger` only when `PRODUCTION=0`.

Two or more writes in one endpoint run inside `prisma.$transaction`. Reads that happen after the transaction starts belong inside it.

## Migrations

Schema changes ship with one reviewed SQL migration. Generate it with `yarn prisma migrate dev --name <name> --create-only`, read the SQL, then apply it. A non-nullable column on a table that already has rows is written by hand: add nullable, backfill every row, then set `NOT NULL`, in that same file. `migrate reset`, migration squashing, and editing an already-applied migration are explicit human decisions.

## Secrets

`.env` and `env.conf` are local and gitignored. Do not print database URLs, passwords, `JWT_SECRET`, or `AUTH_COOKIE_SECRET` into source, docs, commits, logs, or chat. Report a security issue to the contact in `SECURITY.md`. Do not write exploit steps.

## How work moves

The parent agent keeps the conversation and delegates when the work matches a specialist. Specialists start from a clean context, so the parent passes the goal, the files, and the constraints.

| Agent | Model | Writes | Owns |
| --- | --- | --- | --- |
| `architect` | `grok-4.7` high | no | shape of a change before code |
| `feature-engineer` | `composer-2.5` | `src/` | Nest modules on the Articles pattern |
| `prisma-steward` | `grok-4.7` high | `prisma/` | schema, SQL, seeds |
| `security-auditor` | `grok-4.7-xhigh` | no | auth, cookies, permissions, tenant isolation |
| `verifier` | `grok-4.7` xhigh | no product code | lint, tests, and whether the claim is true |
| `docs-keeper` | `composer-2.5-fast` | `docs/` | docs that match the code |

Every specialist is Grok or Composer. Schema and security stay on Grok so a fast parent does not downgrade that work, and review stays on Grok xhigh rather than the Composer model that writes features. If a plan blocks a model, Cursor falls back; say which model actually ran.

Invoke a specialist with `/architect`, `/feature-engineer`, `/prisma-steward`, `/security-auditor`, `/verifier`, or `/docs-keeper`.

## Skills and rules

Skills are procedures. Rules are invariants that stay in context.

| Skill | Use when |
| --- | --- |
| `nest-feature` | adding or changing a module under `src/` |
| `api-contract` | touching DTOs, entities, or Swagger responses |
| `authz-wiring` | touching guards, roles, permissions, or cookies |
| `prisma-change` | touching `prisma/schema`, migrations, or seeds |
| `verify-api` | checking that a change actually works |

Rules in `.cursor/rules/` cover the request path, Nest layering, Prisma and MySQL, auth and tenancy, the API contract, and secrets.

## Definition of done

A change is done when the layer is correct, the tenant client is the one that runs the query, the permission exists for a new resource, the migration SQL has been read, secrets stayed local, and `yarn lint` plus the relevant tests have been run. Behavior that a caller or operator can see is reflected in `docs/`.
