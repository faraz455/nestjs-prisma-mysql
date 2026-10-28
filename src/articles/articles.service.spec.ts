import { ArticlesService } from './articles.service';

function prisma() {
  return {
    article: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('ArticlesService', () => {
  it('creates an article id and returns only that id', async () => {
    const db = prisma();
    db.article.create.mockImplementation(async () => ({
      articleId: 'article-generated',
    }));
    const result = await new ArticlesService(db as never).create({
      title: 'Hello',
      body: 'Body',
      published: false,
    });
    const data = db.article.create.mock.calls[0][0].data;
    expect(data.title).toBe('Hello');
    expect(data.published).toBe(false);
    expect(data.articleId).toBeUndefined();
    expect(result).toEqual({ id: 'article-generated' });
  });

  it('lists every article when search is missing or blank', async () => {
    const db = prisma();
    db.article.count.mockResolvedValue(0);
    db.article.findMany.mockResolvedValue([]);
    const service = new ArticlesService(db as never);

    await service.findAll({ page: 1, perPage: 30 });
    await service.findAll({ page: 1, perPage: 30, search: '' });

    expect(db.article.count).toHaveBeenNthCalledWith(1, {
      where: { OR: undefined },
    });
    expect(db.article.count).toHaveBeenNthCalledWith(2, {
      where: { OR: undefined },
    });
  });

  it('searches title and body and pages the result', async () => {
    const db = prisma();
    db.article.count.mockResolvedValue(25);
    db.article.findMany.mockResolvedValue([]);
    const result = await new ArticlesService(db as never).findAll({
      page: 2,
      perPage: 10,
      search: 'Ada',
    });
    const where = {
      OR: [{ body: { contains: 'Ada' } }, { title: { contains: 'Ada' } }],
    };
    expect(db.article.count).toHaveBeenCalledWith({ where });
    expect(db.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, take: 10, skip: 10 }),
    );
    expect(result).toEqual({ pages: 3, count: 25, records: [] });
  });

  it('returns no pages when nothing matches', async () => {
    const db = prisma();
    db.article.count.mockResolvedValue(0);
    db.article.findMany.mockResolvedValue([]);
    await expect(
      new ArticlesService(db as never).findAll({
        page: 1,
        perPage: 30,
        search: 'zzz',
      }),
    ).resolves.toEqual({ pages: 0, count: 0, records: [] });
  });

  it('reads, patches, and deletes one article by id', async () => {
    const db = prisma();
    const record = { articleId: 'a1', title: 'Hello', published: false };
    db.article.findUniqueOrThrow.mockResolvedValue(record);
    const service = new ArticlesService(db as never);

    await expect(service.findOne('a1')).resolves.toBe(record);
    await expect(service.update('a1', { published: false })).resolves.toEqual({
      id: 'a1',
    });
    await expect(service.remove('a1')).resolves.toEqual({ id: 'a1' });

    expect(db.article.update).toHaveBeenCalledWith({
      where: { articleId: 'a1' },
      data: { published: false },
    });
    expect(db.article.delete).toHaveBeenCalledWith({
      where: { articleId: 'a1' },
    });
    expect(db.article.findUniqueOrThrow.mock.calls[0][0].select.articleId).toBe(
      true,
    );
  });
});
