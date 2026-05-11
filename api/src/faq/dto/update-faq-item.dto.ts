import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateFaqItemDto {
  @ApiProperty({
    required: false,
    example: { az: 'Sual', ru: 'Вопрос' },
  })
  question?: { az: string; ru: string };

  @ApiProperty({
    required: false,
    example: { az: 'Cavab', ru: 'Ответ' },
  })
  answer?: { az: string; ru: string };

  @ApiProperty({ required: false })
  order?: number;

  @ApiProperty({ required: false })
  page?: string;

  @ApiProperty({
    required: false,
    isArray: true,
    type: String,
    example: ['home', 'course:slug'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pages?: string[];
}
