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
  Request,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  ParseBoolPipe,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/guards/optional-jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role, PostType } from '@prisma/client';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';
import { SharpPipe } from 'src/pipes/sharp.pipe';
import { multerConfig } from 'src/multer/config';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly sharpPipe: SharpPipe,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.AUTHOR, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create post',
    description: 'Creates a new post',
  })
  @ApiBody({
    type: CreatePostDto,
    description: 'Post creation payload',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imageAz', maxCount: 1 },
        { name: 'imageRu', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles()
    files: { imageAz?: Express.Multer.File[]; imageRu?: Express.Multer.File[] },
    @Request() req,
  ) {
    try {
      let imageUrl: { az?: string; ru?: string } | undefined;
      if (files?.imageAz?.[0]) {
        const az = await this.sharpPipe.transform(files.imageAz[0]);
        imageUrl = { ...imageUrl, az };
      }
      if (files?.imageRu?.[0]) {
        const ru = await this.sharpPipe.transform(files.imageRu[0]);
        imageUrl = { ...imageUrl, ru };
      }
      return await this.postService.create(
        {
          ...createPostDto,
          ...(imageUrl && Object.keys(imageUrl).length > 0 && { imageUrl }),
        },
        req.user.id,
        req.user.role,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message || error);
    }
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.AUTHOR, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload image for post content (WYSIWYG inline)',
    description: 'Uploads an image and returns relative URL for use in post content',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiResponse({ status: 201, description: 'Image uploaded, returns { url: string }' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadContentImage(
    @UploadedFile(new SharpPipe({ folder: 'post', maxDimension: 1920, quality: 82 }))
    filename: string,
  ) {
    const url = filename ? `post/${filename}` : '';
    return { url };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all posts',
    description: 'Retrieves a paginated list of all posts. When authenticated as AUTHOR, returns only own BLOG posts.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description:
      'Whether to include unpublished posts (requires admin/author role)',
    example: false,
  })
  @ApiQuery({
    name: 'includeBlogs',
    required: false,
    type: Boolean,
    description: 'Whether to include blog posts (requires admin/author role)',
    example: false,
  })
  @ApiQuery({
    name: 'eventStatus',
    required: false,
    type: String,
    description: 'Filter events by status (UPCOMING, PAST)',
    example: 'UPCOMING',
  })
  @ApiQuery({
    name: 'excludeOffers',
    required: false,
    type: Boolean,
    description:
      'When true (mixed feed, no postType): omit OFFERS (kampaniyalar). With includeBlogs=false, only NEWS+EVENT.',
  })
  @ApiQuery({
    name: 'blogCategoryId',
    required: false,
    description: 'When listing BLOG posts only, filter by category id',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Başlıqda axtarış (az/ru)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of posts retrieved successfully',
  })
  async findAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('includeUnpublished', new ParseBoolPipe({ optional: true }))
    includeUnpublished = false,
    @Query('postType') postType = null,
    @Query('includeBlogs', new ParseBoolPipe({ optional: true }))
    includeBlogs = false,
    @Query('eventStatus') eventStatus = null,
    @Query('tag') tag?: string,
    @Query('excludeOffers', new ParseBoolPipe({ optional: true }))
    excludeOffers = false,
    @Query('blogCategoryId') blogCategoryId?: string,
    @Query('search') search?: string,
    @Request() req?: { user?: { id: string; role: string } },
  ) {
    const user = req?.user;
    return this.postService.findAll(
      page,
      limit,
      includeUnpublished,
      postType,
      includeBlogs,
      eventStatus,
      user?.id,
      user?.role as Role,
      tag,
      excludeOffers,
      blogCategoryId,
      search,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.AUTHOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current author\'s blog posts',
    description: 'Returns only the authenticated AUTHOR\'s own BLOG posts. Requires AUTHOR role.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'includeUnpublished', required: false, type: Boolean, example: true })
  @ApiQuery({
    name: 'blogCategoryId',
    required: false,
    description: 'Filter author blogs by category',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Başlıqda axtarış (az/ru)',
  })
  @ApiResponse({ status: 200, description: 'Author\'s blog posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - AUTHOR role required' })
  async findMyPosts(
    @Request() req: { user: { id: string; role: string } },
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('includeUnpublished', new ParseBoolPipe({ optional: true }))
    includeUnpublished = true,
    @Query('blogCategoryId') blogCategoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.postService.findAll(
      page,
      limit,
      includeUnpublished,
      PostType.BLOG,
      true,
      undefined,
      req.user.id,
      Role.AUTHOR,
      undefined,
      false,
      blogCategoryId,
      search,
    );
  }

  @Get('type/:type')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get posts by type',
    description: 'Retrieves posts filtered by type (BLOG, NEWS, EVENT, OFFERS). AUTHOR only gets own BLOG.',
  })
  @ApiParam({
    name: 'type',
    required: true,
    description: 'Type of posts to retrieve',
    enum: PostType,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description:
      'Whether to include unpublished posts (requires admin/author role)',
    example: false,
  })
  @ApiQuery({
    name: 'blogCategoryId',
    required: false,
    description: 'For BLOG type: filter by blog category id',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Başlıqda axtarış (az/ru)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of posts retrieved successfully',
  })
  async getPostsByType(
    @Param('type') type: PostType,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('includeUnpublished') includeUnpublished = false,
    @Query('eventStatus') eventStatus?: string,
    @Query('tag') tag?: string,
    @Query('blogCategoryId') blogCategoryId?: string,
    @Query('search') search?: string,
    @Request() req?: { user?: { id: string; role: string } },
  ) {
    const user = req?.user;
    return this.postService.getPostsByType(
      type,
      +page,
      +limit,
      includeUnpublished,
      eventStatus,
      user?.id,
      user?.role as Role,
      tag,
      blogCategoryId,
      search,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get post by slug',
    description: 'Retrieves a specific post by its slug',
  })
  @ApiParam({
    name: 'slug',
    required: true,
    description: 'Slug of the post to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.postService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get post by ID',
    description: 'Retrieves a specific post by its ID. AUTHOR can only get own posts.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the post to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - AUTHOR can only view own posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string, @Request() req?: { user?: { id: string; role: string } }) {
    const user = req?.user;
    return this.postService.findOne(id, user?.id, user?.role as Role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.AUTHOR, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update post',
    description: 'Updates a specific post',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the post to update',
    type: String,
  })
  @ApiBody({
    type: UpdatePostDto,
    description: 'Post update payload',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imageAz', maxCount: 1 },
        { name: 'imageRu', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles()
    files?: { imageAz?: Express.Multer.File[]; imageRu?: Express.Multer.File[] },
    @Request() req?: { user: { id: string; role: string } },
  ) {
    try {
      let imageUrl: { az?: string; ru?: string } | undefined;
      if (files?.imageAz?.[0]) {
        const az = await this.sharpPipe.transform(files.imageAz[0]);
        imageUrl = { ...imageUrl, az };
      }
      if (files?.imageRu?.[0]) {
        const ru = await this.sharpPipe.transform(files.imageRu[0]);
        imageUrl = { ...imageUrl, ru };
      }
      return await this.postService.update(
        id,
        {
          ...updatePostDto,
          ...(imageUrl && Object.keys(imageUrl).length > 0 && { imageUrl }),
        },
        req?.user?.id,
        req?.user?.role as Role,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message || error);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.AUTHOR, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete post',
    description: 'Deletes a specific post. AUTHOR can only delete own posts.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the post to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - AUTHOR can only delete own posts',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async remove(@Param('id') id: string, @Request() req: { user: { id: string; role: string } }) {
    return this.postService.remove(id, req.user.id, req.user.role as Role);
  }
}
