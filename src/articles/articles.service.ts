import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_SERVICE } from 'src/multi-tenant/multi-tenant.module';

import {
  MakeTimedIDUnique,
  getOffset,
  getPages,
} from 'src/common/common.helper';
import {
  IDDto,
  PaginatedResponseDto,
  PaginationQueryDto,
} from 'src/common/dto';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { ArticleEntity } from './entities';

@Injectable()
export class ArticlesService {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}
  async create(createArticleDto: CreateArticleDto): Promise<IDDto> {
    const record = await this.prisma.article.create({
      select: { articleId: true },
      data: {
        articleId: MakeTimedIDUnique(),
        ...createArticleDto,
      },
    });
    return { id: record.articleId };
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ArticleEntity>> {
    const offset: number = getOffset(query.page, query.perPage);

    const where: Prisma.ArticleWhereInput = {
      OR:
        query.search !== ''
          ? [
              { body: { contains: query.search } },
              { title: { contains: query.search } },
            ]
          : undefined,
    };

    const count = await this.prisma.article.count({ where });

    const records = await this.prisma.article.findMany({
      select: {
        articleId: true,
        title: true,
        body: true,
        description: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
      where,
      take: query.perPage,
      skip: offset,
    });

    const pages = getPages(count, query.perPage);

    return { pages, count, records };
  }

  async findOne(articleId: string): Promise<ArticleEntity> {
    const record = await this.prisma.article.findUniqueOrThrow({
      select: {
        articleId: true,
        title: true,
        body: true,
        description: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { articleId },
    });
    return record;
  }

  async update(
    articleId: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<IDDto> {
    await this.prisma.article.update({
      data: { ...updateArticleDto },
      where: { articleId },
    });

    return { id: articleId };
  }

  async remove(articleId: string): Promise<IDDto> {
    await this.prisma.article.delete({
      where: { articleId },
    });

    return { id: articleId };
  }
}
