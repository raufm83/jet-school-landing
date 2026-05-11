import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { SharpPipe } from 'src/pipes/sharp.pipe';
import { multerConfig } from 'src/multer/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sharpPipe: SharpPipe,
  ) {}

  @Post('login')
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('upload-avatar')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.AUTHOR, Role.HRMANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Returns { url: string }' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const filename = file ? await this.sharpPipe.transform(file) : null;
    const url = filename ? `user/${filename}` : '';
    return { url };
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async register(@Body() createAuthDto: CreateAuthDto, @Request() req) {
    if (req.user.role === Role.STAFF && createAuthDto.role === Role.ADMIN) {
      throw new ForbiddenException('Staff cannot create admin users');
    }
    return this.authService.register(createAuthDto);
  }
}
