import { Prisma, PrismaClient } from '@prisma/client';
import { articleData } from './data/articles.data';

export async function seedArticles(prisma: PrismaClient) {
  console.log('Seeding Articles !!!');

  await prisma.article.createMany({
    data: articleData,
  });

  console.log('Articles seeding done !!!');
  console.log('-----------------------------');
}
