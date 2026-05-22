import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { BlogCategoryService } from './blog-category.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Blog categories')
@Controller('blog-categories')
export class BlogCategoryController {
  constructor(private readonly blogCategoryService: BlogCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List blog categories (for post forms)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max items',
    example: 200,
  })
  async findAll(@Query('limit') limitRaw?: string) {
    const limit = limitRaw !== undefined ? +limitRaw : 500;
    return this.blogCategoryService.findAll(Number.isFinite(limit) ? limit : 500);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one blog category' })
  async findOne(@Param('id') id: string) {
    return this.blogCategoryService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create blog category (admin/content)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.blogCategoryService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reorder a blog category' })
  async reorder(@Body() body: { id: string; order: number }) {
    if (!body?.id || typeof body?.order !== 'number') {
      throw new BadRequestException('id and order are required');
    }
    return this.blogCategoryService.reorder(body.id, body.order);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update blog category (admin/content)' })
  patch(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blogCategoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete blog category (posts lose category)' })
  remove(@Param('id') id: string) {
    return this.blogCategoryService.remove(id);
  }
}
