import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { deleteData, seedBaseData } from './seeding-helpers/base.seed';

/**
 * Sample-data reset for the one database named by DATABASE_URL.
 *
 * This is local test data. It is not a migration, and it is not for a
 * database you need to keep. Production setup is `yarn prisma migrate deploy`
 * and your own users. Skip this command for that database.
 *
 * The command does two things, in order:
 * 1. Delete every application row. The schema and `_prisma_migrations` stay.
 * 2. Insert the sample roles, permissions, users, and articles again.
 *
 * A failure after the delete leaves those tables empty. Run the command
 * again to insert the sample. It does not read `env.conf`, so other tenant
 * databases are untouched.
 *
 * Sample usernames and passwords live in `prisma/seeding-helpers/user.seed.ts`.
 * Change them there before you rely on the sample accounts.
 *
 * `yarn data:reset` and `yarn prisma db seed` both run this file.
 * `yarn prisma migrate reset` is different: it drops the database first,
 * then runs this file. Do not point either command at production data.
 */
function databaseLabel(url: string): string {
  try {
    const name = new URL(url).pathname.replace(/^\//, '').split('?')[0];
    if (!name || name.includes('/') || name.includes('@')) {
      return 'the database named by DATABASE_URL';
    }
    return `database "${name}"`;
  } catch {
    return 'the database named by DATABASE_URL';
  }
}

function printResetNotice(url: string): void {
  console.log('Sample data reset');
  console.log('-----------------');
  console.log(
    `This deletes every application row in ${databaseLabel(url)}, then inserts sample test data.`,
  );
  console.log('The schema and migration history are left in place.');
  console.log('Skip this command when that database holds production data.');
  console.log(
    'Change the sample usernames and passwords in prisma/seeding-helpers/user.seed.ts if you use these accounts.',
  );
  console.log('-----------------');
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required to reset sample data');
  }

  printResetNotice(url);

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(url),
  });

  try {
    await deleteData(prisma);
    await seedBaseData(prisma);
    console.log('\nSample data reset finished.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
