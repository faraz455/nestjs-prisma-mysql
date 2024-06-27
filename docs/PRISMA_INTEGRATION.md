## Prisma Integration

Prisma is a next-generation object-relational mapper (ORM) designed specifically for Node.js and TypeScript. It offers a streamlined and intuitive approach to interacting with databases, making your development experience more efficient and enjoyable.

### Key Benefits of Prisma

- **Intuitive data model**: Define your database schema using a concise and human-readable syntax.
- **Automated migrations**: Effortlessly manage database schema changes through automated migrations.
- **Type-safety and auto-completion**: Benefit from TypeScript's inherent type-safety and auto-completion features, simplifying query development and reducing errors.

### Prisma Setup

This project utilizes yarn to manage dependencies. Running `yarn install` will automatically install both Prisma and its client library as defined in the package.json file. However, if you prefer manual installation, you can use the following commands:

```bash
$ yarn add prisma@latest
$ yarn add @prisma/client@latest
```

To apply all the current migrations located in the prisma/migrations folder to your MySQL database.

```bash
$ yarn prisma migrate deploy
```

This ensures that the database schema reflects the latest changes defined in your Prisma models.

Execute below command to generate the Prisma client. This client serves as an interface for interacting with your database, allowing you to perform queries and data manipulation operations.

```bash
$ yarn prisma generate
```

By following these steps, you'll successfully set up Prisma and its client, enabling you to seamlessly interact with your MySQL database within the project.

### Aditional Resources

- [Prisma playground](https://playground.prisma.io/) - Practice your Prisma queries and migrations in an interactive environment.
- [Primsa Documentation](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma) - Dive deeper into Prisma functionalities with the comprehensive official documentation.
