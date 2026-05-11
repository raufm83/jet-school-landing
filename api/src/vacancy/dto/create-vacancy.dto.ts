import { ApiProperty } from '@nestjs/swagger';

export class CreateVacancyDto {
  @ApiProperty({
    example: { az: 'Frontend Developer', ru: 'Frontend-разработчик' },
  })
  title: { az: string; ru: string };

  @ApiProperty({
    example: {
      az: 'React, TypeScript bilikləri...',
      ru: 'Знание React, TypeScript...',
    },
  })
  description: { az: string; ru: string };

  @ApiProperty({
    required: false,
    example: {
      az: 'Ali təhsil, 2 il təcrübə...',
      ru: 'Высшее образование, 2 года опыта...',
    },
  })
  requirements?: { az: string; ru: string };

  @ApiProperty({
    required: false,
    example: {
      az: 'Həftəlik 40 saat, ofis formatı, bonuslar...',
      ru: '40 часов в неделю, офис, бонусы...',
    },
    description: 'İş şəraiti — rich HTML (editor ilə yaradılır).',
  })
  workConditions?: { az: string; ru: string };

  @ApiProperty({
    required: false,
    example: { az: 'frontend-developer', ru: 'frontend-razrabotchik' },
    description: 'Boşdursa başlıqdan avtomatik slug yaradılır',
  })
  slug?: { az?: string; ru?: string };

  @ApiProperty({ required: false, default: true })
  isActive?: boolean;

  @ApiProperty({ required: false, default: 0 })
  order?: number;

  @ApiProperty({
    required: false,
    example: { az: ['Full-time', 'Remote'], ru: ['Полная занятость', 'Удалённо'] },
    description: 'Dil üzrə tag siyahıları',
  })
  tags?: { az?: string[]; ru?: string[] };

  @ApiProperty({
    required: false,
    description: 'Son müraciət tarixi (ISO string)',
  })
  deadline?: string | null;

  @ApiProperty({
    required: false,
    enum: ['FULL_TIME', 'PART_TIME', 'REMOTE', 'FREELANCE'],
    description: 'İş rejimi',
  })
  employmentType?: string | null;

  @ApiProperty({
    required: false,
    enum: ['NONE', 'Y1', 'Y1_3', 'Y3_5', 'Y5_PLUS'],
    description: 'Təcrübə müddəti',
  })
  experienceLevel?: string | null;
}
