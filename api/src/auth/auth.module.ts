import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { SharpPipe } from 'src/pipes/sharp.pipe';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
    MulterModule.register(),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: SharpPipe,
      useFactory: () =>
        new SharpPipe({ folder: 'user', maxDimension: 512, quality: 80 }),
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
