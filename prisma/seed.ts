import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedBaseData } from './seeding-helpers/base.seed';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required to seed');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(url),
  });
  await seedBaseData(prisma);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {});
