import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleryService } from './gallery.service';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SharpPipe } from 'src/pipes/sharp.pipe';
import { multerConfig } from 'src/multer/config';

@ApiTags('Gallery')
@Controller('gallery')
@ApiBearerAuth('JWT-auth')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async create(
    @Body() createGalleryDto: CreateGalleryDto,
    @UploadedFile(new SharpPipe({ folder: 'gallery', maxDimension: 1920, quality: 82 }))
    imageUrl: string,
  ) {
    return this.galleryService.create({
      ...createGalleryDto,
      imageUrl,
    });
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async reorder(@Body() body: { id: string; order: number }) {
    if (!body?.id || typeof body?.order !== 'number') {
      throw new BadRequestException('id and order are required');
    }
    return this.galleryService.update(body.id, { order: body.order });
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['order', 'createdAt'] })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('sortBy') sortBy: 'order' | 'createdAt' = 'order',
  ) {
    return this.galleryService.findAll(+page, +limit, order, sortBy);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  @Patch(':id/details')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async updateDetails(
    @Param('id') id: string,
    @Body() body: UpdateGalleryDto,
  ) {
    return this.galleryService.update(id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async update(
    @Param('id') id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
    @UploadedFile(new SharpPipe({ folder: 'gallery', maxDimension: 1920, quality: 82 }))
    imageUrl: string | null,
    @Req() req?: Request,
  ) {
    const body = req?.body ?? {};
    const payload = {
      ...body,
      ...updateGalleryDto,
      ...(imageUrl && { imageUrl }),
    };
    return this.galleryService.update(id, payload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
