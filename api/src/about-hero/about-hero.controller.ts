import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SharpPipe } from 'src/pipes/sharp.pipe';
import { multerConfig } from 'src/multer/config';
import { AboutHeroService } from './about-hero.service';
import { UpdateAboutHeroJsonDto } from './dto/update-about-hero-json.dto';

@ApiTags('About Hero')
@Controller('about-hero')
export class AboutHeroController {
  constructor(private readonly aboutHeroService: AboutHeroService) {}

  @Get()
  @ApiOperation({ summary: 'Haqqimizda giris hissesi (ictimai). Movcud deyilse null.' })
  @ApiResponse({ status: 200, description: 'About hero ve ya null' })
  async getPublic() {
    return (await this.aboutHeroService.findPublic()) ?? null;
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER, Role.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('application/json')
  @ApiBody({ type: UpdateAboutHeroJsonDto })
  @ApiOperation({
    summary: 'Haqqimizda giris mezmununu saxla (JSON; shekil ayri POST /about-hero/image)',
  })
  @ApiResponse({ status: 200, description: 'Yenilendi / yaradildi' })
  async updateContent(@Body() dto: UpdateAboutHeroJsonDto) {
    return this.aboutHeroService.updateFromJson(dto);
  }

  @Post('image')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER, Role.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ summary: 'Haqqimizda sheklini yukle; cavabda imageUrl (PATCH ucun)' })
  @ApiResponse({ status: 201, description: '{ imageUrl: "about-hero/....webp" }' })
  async uploadHeroImage(
    @UploadedFile(
      new SharpPipe({ folder: 'about-hero', maxDimension: 1400, quality: 82 }),
    )
    image: string | null,
  ) {
    if (!image) {
      throw new BadRequestException('Shekil fayli gonderilmeyib');
    }
    const imageUrl = path.posix.join('about-hero', image);
    return { imageUrl };
  }
}
