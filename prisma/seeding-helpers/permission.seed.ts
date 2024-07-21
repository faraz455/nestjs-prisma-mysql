import { Prisma, PrismaClient } from '@prisma/client';
import { MakeTimedIDUnique } from '../../src/common/common.helper';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Seeding Resource Permissions !!!');

  const permissionsData: Prisma.ResourcePermissionUncheckedCreateInput[] = [];
  permissionsData.push({
    resourcePermissionId: MakeTimedIDUnique(),
    resourceName: 'Article',
    roleId: 'SUPERADMIN',
    create: true,
    view: true,
  });

  permissionsData.push({
    resourcePermissionId: MakeTimedIDUnique(),
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
