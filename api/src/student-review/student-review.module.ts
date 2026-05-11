import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { StudentReviewController } from './student-review.controller';
import { StudentReviewService } from './student-review.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
  ],
  controllers: [StudentReviewController],
  providers: [StudentReviewService],
})
export class StudentReviewModule {}
