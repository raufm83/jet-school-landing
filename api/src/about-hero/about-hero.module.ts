import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from 'src/prisma.module';
import { AboutHeroController } from './about-hero.controller';
import { AboutHeroService } from './about-hero.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    MulterModule.register(),
    PrismaModule,
  ],
  controllers: [AboutHeroController],
  providers: [AboutHeroService],
})
export class AboutHeroModule {}
