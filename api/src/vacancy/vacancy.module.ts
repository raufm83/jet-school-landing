import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { VacancyService } from './vacancy.service';
import { VacancyController } from './vacancy.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
  ],
  controllers: [VacancyController],
  providers: [VacancyService],
})
export class VacancyModule {}
