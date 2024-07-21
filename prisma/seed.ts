import { PrismaClient } from '@prisma/client';
import { seedBaseData } from './seeding-helpers/base.seed';

async function main() {
  const prisma = new PrismaClient();
  await seedBaseData(prisma);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {});
