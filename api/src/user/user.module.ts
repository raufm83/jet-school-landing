import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { ProfileController } from './profile.controller';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController, UserController],
  providers: [UserService, JwtService],
})
export class UserModule {}
