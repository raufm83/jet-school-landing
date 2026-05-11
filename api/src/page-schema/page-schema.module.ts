import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma.module';
import { PageSchemaController } from './page-schema.controller';
import { PageSchemaService } from './page-schema.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
  ],
  controllers: [PageSchemaController],
  providers: [PageSchemaService],
  exports: [PageSchemaService],
})
export class PageSchemaModule {}
