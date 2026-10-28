---
name: nest-feature
description: Adds or changes a NestJS feature module using the Articles pattern, request-scoped Prisma, and AppModule registration. Use when creating or editing controllers, services, modules, or feature folders under src/.
---

# Nest feature

Copy the shape of `src/articles/`. One feature folder contains `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, and `entities/`, each with an `index.ts` barrel.

## Checklist

- [ ] Module providers list the service. Controllers list the controller.
- [ ] `AppModule` imports the feature module.
- [ ] Service constructor is `@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService`.
- [ ] Imports of `PrismaService` come from `src/prisma/prisma.service`. The token comes from `src/multi-tenant/multi-tenant.module`.
- [ ] Create omits the id so Prisma assigns `@default(uuid(7))`, and returns `{ id }`. Session ids stay `randomBytes` in `AuthService`.
- [ ] List uses `PaginationQueryDto`, `getOffset`, `getPages`, and returns `{ pages, count, records }`.
- [ ] Single reads use `findUniqueOrThrow`.
- [ ] Update spreads the DTO and does not require omitted keys.
- [ ] Two or more writes in one method use `this.prisma.$transaction`.
- [ ] Protected controller decorators match `ArticlesController`: guards, `@Roles`, `@ApiTags`, `@ApiBearerAuth`, and per-route `@Permissions`.
- [ ] Static paths for a method are declared above `':id'` paths.
- [ ] The service spec and an HTTP test cover the new route. Follow `api-tests`.

## Response wrappers

- Create: `@ApiCreatedResponse({ type: IDDto })`
- Update and delete: `@ApiOkResponse({ type: IDDto })`
- One record: `@ApiOkResponse({ type: Entity })`
- List: `@ApiPaginatedResponse({ status: 200, type: Entity })` from `src/common/responses`

A new Prisma model is a `prisma-change` task. Wire the service to the model only after the schema exists.
