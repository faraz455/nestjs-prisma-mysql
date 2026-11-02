import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { articleData } from './data/articles.data';

/// Sample articles for the local test reset. Replace or skip them when the database holds real content.
export async function seedArticles(prisma: PrismaClient) {
  console.log('Inserting sample articles.');

  await prisma.article.createMany({
    data: articleData,
  });

  console.log('Sample articles inserted.');
}
