import { Inject, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_SERVICE } from 'src/multi-tenant/multi-tenant.module';

@Injectable()
export class ArticlesService {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}
  async create(createArticleDto: CreateArticleDto) {
    await this.prisma.article.create({ data: { body: 'sdf', title: 'sdf' } });
    return 'This action adds a new article';
  }

  async findAll() {
    return await this.prisma.article.findMany();
    return `This action returns all articles`;
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
