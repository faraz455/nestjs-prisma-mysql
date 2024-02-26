<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

# Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
  - [Setting up environment variables](#setting-up-environment-variables)
    - [Basic Environment](#basic-environment)
    - [Tenant Configuration](#tenant-configuration)
  - [Prisma Migrations](#prisma-migrations)
    - [Baselining your database](#baselining-your-database)
    - [Applying a new migration](#applying-a-new-migration)
    - [Applying all migrations](#applying-all-migrations)
    - [Merge all migrations](#merge-all-migrations)
- [Running the app](#running-the-app)

## Installation

```bash
$ yarn install
```

## Setting up environment variables

### Basic Environment

Create a `.env` file in the root directory of the repository and add the following lines:

```
DATABASE_URL=mysql://<username>:<password>@<host-address:port>/<db-name>
TIMEZONE=<0>

LOG_QUERIES=<0 or 1>
LOG_REQUESTS=<0 or 1>
PRODUCTION=<0 or 1>
```

E.g.

```
DATABASE_URL=mysql://root:1234@localhost:3306/rms-backend
TIMEZONE=0

LOG_QUERIES=0
LOG_REQUESTS=1
PRODUCTION=0
```

Remember, the `DATABASE_URL` environment variable should refer to your dev database and is only present for use with the Prisma CLI. To see how to configure the database(s) you wish to use when running the server, see Tenant Configuration below.


### Tenant Configuration

This application is designed to be multi-tenant. That is, multiple users will use a single deployment, with the services provided being distinguished by the host address.

A tenant configuration file needs to be added for this. Create `env.conf` in the root directory of the repository as follows:

```
[<host-address>]

SITE_CODE=qa
BASE_URL=http://<host-address>
AUTH_COOKIE_NAME=<cookie-name>

# DATABASE
DB_HOST_MAIN=<db-host>:<db-port>
DB_USER=<db-user>
DB_PASSWORD=<db-password>
DB_NAME=<db-name>
DB_DEBUG=0 or 1
```

E.g.

```
[localhost:3000]

SITE_CODE=qa
BASE_URL=http://localhost:3000
AUTH_COOKIE_NAME=_qa_

# DATABASE
DB_HOST_MAIN=localhost:3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=rms-backend
DB_DEBUG=0
```

Copy paste the above as many times as you wish to serve multiple tenants. Make sure to update their host addresses and environment details accordingly.

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

#### Preferred Way

For the preferred method, refer to the [Prisma Documentation on squashing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations#how-to-squash-migrations).

You will need to `truncate _prisma_migration;` table at start of this process.

#### Another Way to Consolidate Migrations

To consolidate all migrations into a single file, follow these steps:

1. **Delete Prisma migration folder.**

2. **Empty `_prisma_migrations` table from the database.**

   ```sql
   TRUNCATE _prisma_migrations; -- Apply this in the database
   ```

3. **Create `init` migration (single migration).**

   ```bash
   $ yarn prisma migrate dev --create-only
   ```

   When prompted, provide a name for the migration, such as `init`.

4. **Mark the created migration as resolved.**
   ```bash
   $ yarn prisma migrate resolve --applied 20230822120011_init
   ```
   This step will generate a single migration file for all migrations.

**Note:**
`Please ensure there is no seeding data in the migration files before following these steps; otherwise, seeding data may be lost.`


## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
