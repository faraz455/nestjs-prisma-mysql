import { Inject, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
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
import { Prisma } from '@prisma/client';
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
    const offset: number = getOffset(query.page, query.per_page);

    const where: Prisma.ArticleWhereInput = {
      OR: query.search
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
      take: query.per_page,
      skip: offset,
    });

    const pages = getPages(count, query.per_page);

    return { pages, count, records };
  }

  findOne(id: number) {
    return `This action returns a #${id} article`;
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
    return `This action updates a #${id} article`;
  }

  remove(id: number) {
    return `This action removes a #${id} article`;
  }
}
