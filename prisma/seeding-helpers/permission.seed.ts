import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Seeding Resource Permissions !!!');

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

  const records = await prisma.resourcePermission.createMany({
    data: permissionsData,
  });

  console.log('Resource Permissions seeding done !!!');
  console.log('-----------------------------');
}
