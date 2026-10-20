---
name: prisma-change
description: Changes the Prisma 5.18 MySQL schema, writes a reviewed migration, and updates seeds. Use when editing prisma/schema, prisma/migrations, or prisma/seeding-helpers.
---

# Prisma change

Installed Prisma is 5.18.0. Schema files are a folder. Preview features in use are `relationJoins` and `prismaSchemaFolder`. Stay on this version.

## Where models go

- Datasource and generator: `prisma/schema/schema.prisma`
- Users, roles, permissions, refresh tokens: `prisma/schema/auth.prisma`
- New content models: a file in `prisma/schema/` next to `Article`, or `schema.prisma` when the model is small and related to existing content

Ids:

```prisma
model Example {
  exampleId String @id @db.Char(40)
}
```

The service assigns that id with `MakeTimedIDUnique()`.

## Migration

```bash
yarn prisma migrate dev --name <name> --create-only
```

Read `prisma/migrations/<timestamp>_<name>/migration.sql`. Then apply with `yarn prisma migrate dev` only when the SQL matches the intent.

If the table already has rows and the new column is required, replace the generated `ADD COLUMN ... NOT NULL` with:

1. add the column nullable
2. backfill every existing row
3. alter the column to `NOT NULL`

Do that in the same migration file. Do not reset or squash unless the user explicitly asks.

CLI and seed use `.env` `DATABASE_URL`. The running API uses `env.conf`. After a migration, tell the user which tenant databases still need `yarn prisma migrate deploy`.

## Seeds

Add sample rows in `prisma/seeding-helpers/` and call them from `prisma/seed.ts` when the new data is part of `yarn data:seed`. Permission seeds use `roleId` `SUPERADMIN` or `ADMIN`.
