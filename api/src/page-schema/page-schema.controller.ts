import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { PageSchemaService } from './page-schema.service';
import { UpsertPageSchemaDto } from './dto/upsert-page-schema.dto';

@ApiTags('Page Schema (SEO JSON-LD)')
@Controller('page-schema')
export class PageSchemaController {
  constructor(private readonly pageSchemaService: PageSchemaService) {}

  @Get()
  @ApiOperation({
    summary: 'Get schema by pageKey+locale (public) or list all (admin)',
  })
  @ApiQuery({ name: 'pageKey', required: false, description: 'Page identifier' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale (az | ru)' })
  @ApiResponse({ status: 200, description: 'Page schema or list' })
  async find(
    @Query('pageKey') pageKey?: string,
    @Query('locale') locale?: string,
  ) {
    if (pageKey && locale) {
      const schema = await this.pageSchemaService.findByKeyAndLocale(
        pageKey,
        locale,
      );
      return schema ?? null;
    }
    return this.pageSchemaService.findAll(pageKey);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update page schema (SEO JSON-LD)' })
  @ApiResponse({ status: 200, description: 'Page schema saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upsertPut(@Body() dto: UpsertPageSchemaDto) {
    return this.upsert(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update page schema (SEO JSON-LD)' })
  @ApiResponse({ status: 200, description: 'Page schema saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upsertPost(@Body() dto: UpsertPageSchemaDto) {
    return this.upsert(dto);
  }

  private async upsert(dto: UpsertPageSchemaDto) {
    return this.pageSchemaService.upsert(dto.pageKey, dto.locale, {
      schemaJson: dto.schemaJson,
    });
  }
}
