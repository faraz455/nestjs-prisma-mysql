import { Prisma, PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('-----------------------------');
  console.log('Seeding Roles !!!');
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

  const records = await prisma.role.createMany({
    data: roleData,
  });

  console.log('Roles seeding done !!!');
  console.log('-----------------------------');
}
