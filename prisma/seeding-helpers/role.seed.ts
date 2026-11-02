import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

/// Sample roles for the local test reset. Ids stay fixed. Guards compare the names.
export async function seedRoles(prisma: PrismaClient) {
  console.log('Inserting sample roles.');
  const roleData: Prisma.RoleUncheckedCreateInput[] = [
    {
      roleId: 'SUPERADMIN',
      roleName: 'SUPER ADMIN',
    },
    {
      roleId: 'ADMIN',
      roleName: 'ADMIN',
    },
  ];

  await prisma.role.createMany({
    data: roleData,
  });

  console.log('Sample roles inserted.');
}
