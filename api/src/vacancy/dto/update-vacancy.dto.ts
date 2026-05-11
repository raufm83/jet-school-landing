import { ApiProperty } from '@nestjs/swagger';

export class UpdateVacancyDto {
  @ApiProperty({ required: false })
  title?: { az: string; ru: string };

  @ApiProperty({ required: false })
  description?: { az: string; ru: string };

  @ApiProperty({ required: false })
  requirements?: { az: string; ru: string };

  @ApiProperty({
    required: false,
    description: 'İş şəraiti — rich HTML (editor ilə yaradılır).',
  })
  workConditions?: { az: string; ru: string };

  @ApiProperty({ required: false })
  slug?: { az?: string; ru?: string };

  @ApiProperty({ required: false })
  isActive?: boolean;

  @ApiProperty({ required: false })
  order?: number;

  @ApiProperty({
    required: false,
    example: { az: ['Full-time'], ru: ['Полная занятость'] },
  })
  tags?: { az?: string[]; ru?: string[] };

  @ApiProperty({ required: false })
  deadline?: string | null;

  @ApiProperty({ required: false, enum: ['FULL_TIME', 'PART_TIME', 'REMOTE', 'FREELANCE'] })
  employmentType?: string | null;

  @ApiProperty({ required: false, enum: ['NONE', 'Y1', 'Y1_3', 'Y3_5', 'Y5_PLUS'] })
  experienceLevel?: string | null;
}
