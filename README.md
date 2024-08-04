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
</p>

## Description

[Nest](https://github.com/nestjs/nest) Framework - A Public Template Repository

This repository provides a comprehensive and production-ready foundation for building scalable backend applications with NestJS, Prisma ORM, and MySQL. It offers a well-structured codebase with essential features and best practices to jumpstart your development journey.

Feel free to clone this repository and use it as a starting point for your NestJS projects.

# Table of Contents

- [Introduction](#introduction)

  - [Project Overview](#project-overview)
  - [Key Features](#key-features)

- [Quick Start](#quick-start)
- [Installation](#installation)

  - [Prerequistes](#prerequisites)

  - [Setting up environment variables](#setting-up-environment-variables)
    - [Basic Environment](#basic-environment)
    - [Tenant Configuration](#tenant-configuration)

- [Running the app](#running-the-app)

- [Prisma Migrations](./docs/prisma/PRISMA_MIGRATIONS.md)

- [Security](#security)
  - [JWT-Based Authentication](./docs/auth/AUTHENTICATION.md)
  - [Role and Permission Authorization](./docs/auth/AUTHORIZATION.md)

## Introduction

### Project Overview

- This repository provides a foundation for building robust **NestJS** applications utilizing **Prisma** as the ORM and **MySQL** as the underlying database. It streamlines the initial setup process, offering essential features commonly required in NestJS projects.

### Key Features

- **Multitenancy Support**: Implement a multi-tenant environment using environment variables and configuration files, enabling data segregation and customized functionalities for different tenants.

- **Efficient Data Management**: Leverage Prisma ORM as an abstraction layer for seamless interaction with your MySQL database, reducing boilerplate code and simplifying data manipulation.

- **Reusable Components**: Utilize common response entities and data transfer objects (DTOs) to ensure consistent data structures and streamline data handling across your application.

- **Enhanced Debugging**: Implement a custom NestJS interceptor to log request details and Prisma queries, providing valuable insights for troubleshooting and monitoring purposes.

- **Interactive API Documentation**: Integrate Swagger documentation to generate clear API descriptions and facilitate user interaction with the application through an interactive interface.

- **Data Validation**: Enforce data integrity and consistency using NestJS validation pipes, ensuring that incoming requests adhere to predefined data structures.

- **Comprehensive Documentation**: Benefit from clear and detailed documentation, including comments and relevant references, to guide you through the codebase and understand its functionality.

- **Enhanced Authentication**: Implement secure authentication using JWT tokens, including throttle control for security, role and permission guards for access control, and login guards for session management.

## Quick Start

### 1. MySQL 8 Docker Setup

If you have already set up MySQL 8, you can skip this step. Otherwise, you can use the following instructions to set up MySQL 8 using Docker.

```yaml
version: '3.5'
services:
  mysql8:
    container_name: mysql8
    hostname: mysql8
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 1234
    ports:
      - '3306:3306'
    volumes:
      - ./database:/var/lib/mysql
    networks:
      - net-db

networks:
  net-db:
    external: true
```

Save the file and run the following command in your terminal:

```bash
$ docker-compose up -d
```

This command will start the MySQL 8 database container.

### 2. Environment Configuration

Create a `.env` file at the root directory of your project with the following content:

```bash
DATABASE_URL=mysql://root:1234@localhost:3306/nestdb
LOG_QUERIES=0
LOG_REQUESTS=1

PRODUCTION=0
TIMEZONE=0

JWT_SECRET=secret
AUTH_COOKIE_SECRET=mycookiesecret

```

Create an `env.conf` file at the root directory of your project with the following content:

```
[localhost:3000]

SITE_CODE=qa
BASE_URL=http://localhost:3000
AUTH_COOKIE_NAME=_qa_

# DATABASE
DB_HOST_MAIN=localhost:3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=nestdb
DB_DEBUG=0
```

### 3. Install Dependencies

To install all the required dependencies, run the following command in your terminal:

```bash
$ yarn install
```

### 4. Prisma Setup

Generate Prisma client and apply migrations:

```bash
$ yarn prisma generate
$ yarn prisma migrate deploy
```

### 5. Start the Server

Run the following command to start the server in development mode:

```bash
$ yarn start:dev
```

## Installation

### Prerequisites

Before proceeding with the setup, ensure that your development system has the following prerequisites installed:

**Node.js**: This project relies on Node.js for its functionality. If you haven't installed it yet, you can download and install the latest version from the [ official Node website](https://nodejs.org/en).

**Yarn**: Yarn is used for efficient dependency management in this project. Make sure Yarn is installed on your system. If not, you can install it by following the instructions on the [official Yarn website.](https://yarnpkg.com/).

To install all the required dependencies, run the following command in your terminal:

```bash
$ yarn install
```

This command will handle the installation of all necessary dependencies for the project.

## Setting up environment variables

### Basic Environment

Create a `.env` file in the root directory of the repository and add the following lines:

```
DATABASE_URL=mysql://<username>:<password>@<host-address:port>/<db-name>
TIMEZONE=<0>

LOG_QUERIES=<0 or 1>
LOG_REQUESTS=<0 or 1>
PRODUCTION=<0 or 1>

JWT_SECRET=<secret>
AUTH_COOKIE_SECRET=<mycookiesecret>
```

E.g.

```
DATABASE_URL=mysql://root:1234@localhost:3306/databaseName
LOG_QUERIES=0
LOG_REQUESTS=1

TIMEZONE=0
PRODUCTION=0

JWT_SECRET=secret
AUTH_COOKIE_SECRET=mycookiesecret
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
DB_NAME=databaseName
DB_DEBUG=0
```

Copy paste the above as many times as you wish to serve multiple tenants. Make sure to update their host addresses and environment details accordingly.

For more detailed information on multi-tenancy, please visit - [docs - multitendancy](./docs/MULTI_TENANCY.md)

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Contributing

Refer to [contribution guidlines](./docs/guidelines/CONTRIBUTING.md) and [coding convntions](./docs/guidelines/CODING_CONVENTIONS.md) and [code of conduct](./CODE_OF_CONDUCT.md).

## Stay in Touch

- **LinkedIn Profile**: [Muhammad Faraz Khan](https://www.linkedin.com/in/farazkhan455/)
- **GitHub Profile**: [Muhammad Faraz Khan](https://github.com/faraz455)
