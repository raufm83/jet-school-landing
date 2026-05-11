import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ApiTags, ApiOperation, ApiConsumes} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';

import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { multerConfig } from '../multer/config';
import { SharpPipe } from '../pipes/sharp.pipe';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CONTENTMANAGER)
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new course' })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile(new SharpPipe({ folder: 'courses', maxDimension: 1280, quality: 82 }))
    imageFilename?: string,
  ) {
    if (imageFilename) {
      createCourseDto.imageUrl = `courses/${imageFilename}`;
    }
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('includeUnpublished') includeUnpublished = false,
    @Query('sort') sort?: string,
  ) {
    return this.courseService.findAll(+page, +limit, includeUnpublished, sort);
  }

  @Get('brief')
  @ApiOperation({ summary: 'Get all courses with brief information' })
  findAllBrief(
    @Query('limit') limit = 10,
    @Query('includeUnpublished') includeUnpublished = false,
    @Query('page') page = 1,
    @Query('sort') sort?: string,
  ) {
    return this.courseService.findAllBrief(+limit, includeUnpublished, +page, sort);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.courseService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Get a specific course' })
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CONTENTMANAGER)
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a course' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile(new SharpPipe({ folder: 'courses', maxDimension: 1280, quality: 82 }))
    imageFilename?: string,
  ) {
    if (imageFilename) {
      updateCourseDto.imageUrl = `courses/${imageFilename}`;
    }
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CONTENTMANAGER)
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}