import { PrismaClient } from '@prisma/client';
import { seedRoles } from './role.seed';
import { seedUsers } from './user.seed';
import { seedPermissions } from './permission.seed';
import { seedArticles } from './article.seed';

/// Seeds all base data: roles, permissions, users, and articles
export async function seedBaseData(prisma: PrismaClient) {
  console.log('Seeding started !!\n');
  await deleteData(prisma);
  await seedRoles(prisma);
  await seedPermissions(prisma);
  await seedUsers(prisma);
  await seedArticles(prisma);
  console.log('\nSeeding done !!!\n');
}

/// Deletes all data from the tables in the correct order
export async function deleteData(prisma: PrismaClient) {
  await prisma.article.deleteMany();
  await prisma.resourcePermission.deleteMany();
  await prisma.userRefreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}
