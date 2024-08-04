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
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators';

@UseGuards(CustomJwtGuard, PermissionsGuard)
@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Permissions({ AND: ['Article.create'] })
  @ApiCreatedResponse({ type: IDDto })
  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Permissions({ AND: ['Article.view'] })
  @ApiPaginatedResponse({ status: 200, type: ArticleEntity })
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Permissions({ AND: ['Article.view'] })
  @ApiOkResponse({ type: ArticleEntity })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Permissions({ AND: ['Article.update'] })
  @ApiOkResponse({ type: IDDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Permissions({ AND: ['Article.delete'] })
  @ApiOkResponse({ type: IDDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
