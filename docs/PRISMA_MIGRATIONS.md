## Prisma Migrations

Prisma migration tools are used to manage the database for this repository. This requires prisma to maintain a record of past migrations, which must be in sync with the database.

### Baselining your database

The following command is used to baseline a database.

```bash
$ yarn prisma migrate resolve --applied <migration-name>
```

This step is not required to work in this repository, and has been left in purely for educational purposes.

### Applying a new migration

To make any modification to the database after having baselined it, simply update the prisma schema as desired. Next, stage your migration using:

```bash
$ yarn prisma migrate dev --name <migration-name> --create-only
```

This will generate the appropriate migration files and sql required, but will **not** apply the migration to your database. If you wish, you can inspect and edit the generate files at this point (in case you need to insert data into a new column, for example). Finally, once you are satisfied that this is the migration you wish to apply, use the following command:

```bash
$ yarn prisma migrate dev
```

See [Prisma's custom migration instructions](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/customizing-migrations) for more information.

### Applying all migrations

When deploying to production/making a new deployment, you will want
to deploy all migrations created uptil now after successfully
baselining your database. To do this, run the following command:

```bash
$ yarn prisma migrate deploy
```

### Merge all Migrations

To consolidate all migrations into a single file, follow these steps:

1. **Delete folders of Prisma migration folder.**
    ```bash
    $ rm -rf prisma/migrations/*
    ```

2. **Empty `_prisma_migrations` table from the database.**

   ```sql
   TRUNCATE _prisma_migrations; -- Apply this in the database
   ```

3. **Create `squashed_migrations` migration (single migration).**

   ```bash
   $ yarn prisma migrate dev --name squashed_migrations
   ```

   When prompted, provide a name for the migration, such as `squashed_migrations` or `init` or anything you like.

4. **Mark the created migration as resolved.**
   ```bash
   $ yarn prisma migrate resolve --applied <Migration name>
   ```
   Migration name will be same as created in migration folder.

   This step will generate a single migration file for all migrations.

You can refer to the [Prisma Documentation on squashing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations#how-to-squash-migrations).

**Note:**
`Please ensure there is no seeding data in the migration files before following these steps; otherwise, seeding data may be lost.`
