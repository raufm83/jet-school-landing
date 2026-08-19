import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpsertPageMetaDto {
  @ApiProperty({ description: 'Page identifier (e.g. courses, about-us, course:slug)', example: 'courses' })
  @IsString()
  pageKey: string;

  @ApiProperty({ description: 'Locale', enum: ['az', 'ru'], example: 'az' })
  @IsString()
  @IsIn(['az', 'ru'])
  locale: string;

  @ApiProperty({ description: 'Meta title', example: 'Kurslar | JET School' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Meta description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Meta keywords', required: false })
  @IsString()
  @IsOptional()
  keywords?: string;
}
