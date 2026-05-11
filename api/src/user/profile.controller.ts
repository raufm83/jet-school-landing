import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Separate controller for /users/me so that GET /users/me is never matched by GET /users/:id (which requires ADMIN).
 * Registered before UserController in the module so these routes take precedence.
 */
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@Request() req: { user: { id: string } }) {
    return this.userService.findOne(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMe(
    @Request() req: { user: { id: string } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const dto = { ...(updateUserDto as Record<string, unknown>) };
    delete dto.role;
    return this.userService.update(req.user.id, dto as UpdateUserDto);
  }
}
