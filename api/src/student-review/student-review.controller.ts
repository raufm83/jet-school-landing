import {
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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StudentReviewService } from './student-review.service';
import { CreateStudentReviewDto } from './dto/create-student-review.dto';
import { UpdateStudentReviewDto } from './dto/update-student-review.dto';

@ApiTags('Student Reviews')
@Controller('student-reviews')
@ApiBearerAuth('JWT-auth')
export class StudentReviewController {
  constructor(private readonly service: StudentReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CONTENTMANAGER)
  @ApiOperation({ summary: 'Create a new student review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  create(@Body() dto: CreateStudentReviewDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all student reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['order', 'createdAt'] })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('sortBy') sortBy: 'order' | 'createdAt' = 'createdAt',
  ) {
    return this.service.findAll(+page, +limit, order, sortBy);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Get a specific student review' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CONTENTMANAGER)
  @ApiOperation({ summary: 'Update a student review' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentReviewDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CONTENTMANAGER)
  @ApiOperation({ summary: 'Delete a student review' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
