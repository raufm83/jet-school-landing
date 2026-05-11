import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGalleryDto {
  @ApiProperty({ example: 'Mobil Tətbiq Layihəsi', description: 'Title (AZ)' })
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty' })
  'title[az]': string;

  @ApiProperty({ example: 'Проект мобильного приложения', description: 'Title (RU)' })
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty' })
  'title[ru]': string;

  @ApiProperty({
    example: 'Mobil tətbiq layihəsi şəklində tələbələr',
    description: 'SEO alt text for image (AZ)',
    required: false,
  })
  @IsOptional()
  @IsString()
  'imageAlt[az]'?: string;

  @ApiProperty({
    example: 'Студенты на фото проекта мобильного приложения',
    description: 'SEO alt text for image (RU)',
    required: false,
  })
  @IsOptional()
  @IsString()
  'imageAlt[ru]'?: string;

  imageUrl?: string;
}
