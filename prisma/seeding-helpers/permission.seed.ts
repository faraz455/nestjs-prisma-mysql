import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

/// Sample Article flags for the local test reset. Not applied in production unless you run the reset.
export async function seedPermissions(prisma: PrismaClient) {
  console.log('Inserting sample permissions.');

  const permissionsData: Prisma.ResourcePermissionUncheckedCreateInput[] = [];
  permissionsData.push({
    resourceName: 'Article',
    roleId: 'SUPERADMIN',
    create: true,
    view: true,
    update: true,
    delete: true,
  });

  permissionsData.push({
    resourceName: 'Article',
    roleId: 'ADMIN',
    view: true,
  });

  await prisma.resourcePermission.createMany({
    data: permissionsData,
  });

  console.log('Sample permissions inserted.');
}
