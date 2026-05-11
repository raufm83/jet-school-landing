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
import { HomeHeroService } from './home-hero.service';
import { UpdateHomeHeroJsonDto } from './dto/update-home-hero-json.dto';

@ApiTags('Home Hero')
@Controller('home-hero')
export class HomeHeroController {
  constructor(private readonly homeHeroService: HomeHeroService) {}

  @Get()
  @ApiOperation({ summary: 'Ana səhifə hero (ictimai). Mövcud deyilsə null.' })
  @ApiResponse({ status: 200, description: 'Hero və ya null' })
  async getPublic() {
    return (await this.homeHeroService.findPublic()) ?? null;
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER, Role.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('application/json')
  @ApiBody({ type: UpdateHomeHeroJsonDto })
  @ApiOperation({
    summary: 'Hero məzmununu saxla (JSON; şəkil ayrıca POST /home-hero/image)',
  })
  @ApiResponse({ status: 200, description: 'Yeniləndi / yaradıldı' })
  async updateContent(@Body() dto: UpdateHomeHeroJsonDto) {
    return this.homeHeroService.updateFromJson(dto);
  }

  @Post('image')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER, Role.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ summary: 'Hero şəklini yüklə; cavabda imageUrl (PATCH üçün)' })
  @ApiResponse({ status: 201, description: '{ imageUrl: "home-hero/....webp" }' })
  async uploadHeroImage(
    @UploadedFile(
      new SharpPipe({ folder: 'home-hero', maxDimension: 900, quality: 82 }),
    )
    image: string | null,
  ) {
    if (!image) {
      throw new BadRequestException('Şəkil faylı göndərilməyib');
    }
    const imageUrl = path.posix.join('home-hero', image);
    return { imageUrl };
  }
}
