import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsMongoId } from 'class-validator';

export class CreateStudentReviewDto {
  @ApiProperty({
    example: { az: 'Rəy başlığı', ru: 'Заголовок отзыва' },
    description: 'Title (AZ, RU) — same as projects',
  })
  @IsNotEmpty()
  title: Record<string, string>;

  @ApiProperty({
    example: {
      az: 'JET School-da keçirdiyim vaxt həyatımı dəyişdi...',
      ru: 'Время, проведённое в JET School, изменило мою жизнь...',
    },
    description: 'Description (AZ, RU)',
  })
  @IsNotEmpty()
  description: Record<string, string>;

  @ApiProperty({
    description: 'Course ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=xxxxx',
    description: 'YouTube video URL',
  })
  @IsNotEmpty()
  link: string;

  @ApiProperty({ required: false, description: 'Display order' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
