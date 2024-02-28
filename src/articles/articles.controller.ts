import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ArticlesService } from './articles.service';

import { ApiPaginatedResponse } from 'src/common/responses';
import { IDDto, PaginationQueryDto } from 'src/common/dto';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { ArticleEntity } from './entities';

import { CustomJwtGuard } from 'src/auth/guards/custom-jwt.guard';

@UseGuards(CustomJwtGuard)
@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiCreatedResponse({ type: IDDto })
  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @ApiPaginatedResponse({ status: 200, type: ArticleEntity })
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.articlesService.findAll(query);
  }

  @ApiOkResponse({ type: ArticleEntity })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @ApiOkResponse({ type: IDDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @ApiOkResponse({ type: IDDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
