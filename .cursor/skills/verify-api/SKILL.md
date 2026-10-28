---
name: verify-api
description: Verifies NestJS and Prisma changes with lint, tests, and a claim checklist. Use when finishing a feature, reviewing a diff, or when the user asks to confirm the work.
---

# Verify API

## Commands

From the repository root:

```bash
yarn lint
yarn test
yarn test:e2e
yarn build
```

Run `yarn test` when a spec covers the change. Run `yarn test:e2e` when a route, guard, pipe, filter, or tenant check changed. Run `yarn build` when a module, provider, or Prisma client type changed. Skip a command only when the repo cannot run it, and say why.

Do not run `prisma migrate reset`, do not drop schemas, and do not cat `.env` or `env.conf`.

## Claim checklist

- [ ] Controller delegates. Service holds the Prisma calls.
- [ ] The service injects `PRISMA_SERVICE`.
- [ ] New module is imported by `AppModule`.
- [ ] DTO, `@ApiProperty`, entity, and return type agree.
- [ ] Guard order is JWT, permissions, roles.
- [ ] A new resource has `ResourceName`, decorators, and a seed row.
- [ ] A schema change has one new SQL file, and that SQL was read.
- [ ] No secret was added to source or docs.

Report exit codes and any checklist item that failed.
