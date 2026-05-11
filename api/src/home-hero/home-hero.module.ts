import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { HomeHeroController } from './home-hero.controller';
import { HomeHeroService } from './home-hero.service';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    MulterModule.register(),
    PrismaModule,
  ],
  controllers: [HomeHeroController],
  providers: [HomeHeroService],
})
export class HomeHeroModule {}
