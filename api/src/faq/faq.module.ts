import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { FaqPublicController } from './faq-public.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
  ],
  controllers: [FaqPublicController, FaqController],
  providers: [FaqService],
})
export class FaqModule {}
