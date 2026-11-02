import { PrismaClient } from '../../src/generated/prisma/client';
import { seedRoles } from './role.seed';
import { seedUsers } from './user.seed';
import { seedPermissions } from './permission.seed';
import { seedArticles } from './article.seed';

/// Inserts the local test sample: roles, permissions, users, then articles.
/// `prisma/seed.ts` deletes existing rows before it calls this.
/// Skip that reset when the database holds production data.
export async function seedBaseData(prisma: PrismaClient) {
  console.log('Inserting sample test data.');
  await seedRoles(prisma);
  await seedPermissions(prisma);
  await seedUsers(prisma);
  await seedArticles(prisma);
}

/// Deletes application rows in foreign-key order.
/// Child rows go before the users and roles they reference.
/// `_prisma_migrations` is not a model here and is not deleted.
/// Add a new model to this list before the rows it points at.
export async function deleteData(prisma: PrismaClient) {
  console.log('Deleting application rows.');
  await prisma.article.deleteMany();
  await prisma.resourcePermission.deleteMany();
  await prisma.userRefreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  console.log('Application rows deleted.');
}
