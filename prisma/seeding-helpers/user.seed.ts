import {
  Gender,
  Prisma,
  PrismaClient,
} from '../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Sample logins for local testing. Change `username` and `password` here
 * before you use the accounts. Keep the user ids. The reset attaches
 * `SUPERADMIN` and `ADMIN` to the roles in `role.seed.ts`.
 *
 * These rows are inserted only by the sample reset (`yarn data:reset`).
 * Skip that command when the database holds production data, and create
 * your own users instead.
 */
const sampleUsers: Array<
  Pick<
    Prisma.UserUncheckedCreateInput,
    'userId' | 'username' | 'firstName' | 'fullName'
  > & { password: string }
> = [
  {
    userId: 'SUPERADMIN',
    username: 'superAdmin',
    password: 'SuperAdmin@1',
    firstName: 'Super Admin',
    fullName: 'Super Admin',
  },
  {
    userId: 'ADMIN',
    username: 'admin',
    password: 'Admin@1',
    firstName: 'Admin',
    fullName: 'Admin',
  },
];

/// Inserts the sample users and their role links. Called after the reset deletes existing rows.
export async function seedUsers(prisma: PrismaClient) {
  console.log('Inserting sample users.');

  const salt = await bcrypt.genSalt();

  const userData: Prisma.UserUncheckedCreateInput[] = [];
  for (const sampleUser of sampleUsers) {
    userData.push({
      userId: sampleUser.userId,
      username: sampleUser.username,
      password: await bcrypt.hash(sampleUser.password, salt),
      firstName: sampleUser.firstName,
      fullName: sampleUser.fullName,
      birthDateString: new Date().toDateString(),
      gender: Gender.MALE,
    });
  }

  await prisma.user.createMany({
    data: userData,
  });

  await prisma.userRole.createMany({
    data: [
      {
        roleId: 'ADMIN',
        userId: 'ADMIN',
      },
      {
        roleId: 'SUPERADMIN',
        userId: 'SUPERADMIN',
      },
    ],
  });

  console.log('Sample users inserted.');
}
