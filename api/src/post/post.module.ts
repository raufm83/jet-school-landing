import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from 'src/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { SharpPipe } from 'src/pipes/sharp.pipe';
import { OptionalJwtAuthGuard } from 'src/guards/optional-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    MulterModule.register(),
    PrismaModule,
  ],
  controllers: [PostController],
  providers: [
    PostService,
    OptionalJwtAuthGuard,
    {
      provide: SharpPipe,
      useFactory: () =>
        new SharpPipe({ folder: 'post', maxDimension: 1920, quality: 82 }),
    },
  ],
})
export class PostModule {}
