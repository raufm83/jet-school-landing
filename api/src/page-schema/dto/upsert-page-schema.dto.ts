import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class UpsertPageSchemaDto {
  @ApiProperty({
    description: 'Page identifier (e.g. home, courses, about-us, course:slug)',
    example: 'courses',
  })
  @IsString()
  pageKey: string;

  @ApiProperty({ description: 'Locale', enum: ['az', 'ru'], example: 'az' })
  @IsString()
  @IsIn(['az', 'ru'])
  locale: string;

  @ApiProperty({
    description: 'JSON-LD schema object or array of schema objects',
    example: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Kurslar' },
  })
  @IsNotEmpty()
  schemaJson: object | object[];
}
