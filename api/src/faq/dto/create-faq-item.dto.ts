import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateFaqItemDto {
  @ApiProperty({
    example: { az: 'Kurslar neçə yaşdan başlayır?', ru: 'С какого возраста курсы?' },
  })
  question: { az: string; ru: string };

  @ApiProperty({
    example: {
      az: 'Kurslarımız 8–17 yaş arası üçün nəzərdə tutulub.',
      ru: 'Наши курсы рассчитаны на возраст 8–17 лет.',
    },
  })
  answer: { az: string; ru: string };

  @ApiProperty({ required: false, default: 0 })
  order?: number;

  @ApiProperty({
    required: false,
    example: 'home',
    description: 'Deprecated: use pages[]',
  })
  page?: string;

  @ApiProperty({
    required: false,
    example: ['home', 'about', 'course:python-101'],
    description: 'Səhifə açarları — bir FAQ bir neçə səhifədə görünə bilər',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pages?: string[];
}
