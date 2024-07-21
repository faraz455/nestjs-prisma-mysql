import { Gender, Prisma, PrismaClient } from '@prisma/client';
import { MakeTimedIDUnique } from '../../src/common/common.helper';

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding Users !!!');

  const userData: Prisma.UserUncheckedCreateInput[] = [
    {
      userId: 'SUPERADMIN',
      username: 'superAdmin',
      password: 'SuperAdmin@1',
      firstName: 'Super Admin',
      fullName: 'Super Admin',
      birthDateString: new Date().toDateString(),
      gender: Gender.MALE,
    },
    {
      userId: 'ADMIN',
      username: 'admin',
      password: 'Admin@1',
      firstName: 'Admin',
      fullName: 'Admin',
      birthDateString: new Date().toDateString(),
      gender: Gender.MALE,
    },
  ];

  const records = await prisma.user.createMany({
    data: userData,
  });

  const recordsV2 = await prisma.userRole.createMany({
    data: [
      {
        userRoleId: MakeTimedIDUnique(),
        roleId: 'ADMIN',
        userId: 'ADMIN',
      },
      {
        userRoleId: MakeTimedIDUnique(),
        roleId: 'SUPERADMIN',
        userId: 'SUPERADMIN',
      },
    ],
  });

  console.log('Users seeding done !!!');
  console.log('-----------------------------');
}
