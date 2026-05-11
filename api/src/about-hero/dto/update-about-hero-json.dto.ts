import { ApiProperty } from '@nestjs/swagger';

export class UpdateAboutHeroJsonDto {
  @ApiProperty({ description: 'Haqqimizda giris mezmunu (HTML), iki dil' })
  bodyHtml: { az: string; ru: string };

  @ApiProperty({ required: false })
  imageAlt?: { az?: string; ru?: string };

  @ApiProperty({
    required: false,
    description:
      'Movcud ve ya yeni yuklenmis sheklin server yolu (mes. about-hero/xxx.webp). Gonderilmese movcud qeyd saxlanilir.',
  })
  imageUrl?: string;

  @ApiProperty({
    required: false,
    description:
      'Missiya/Vizyon bolmesi: sectionTitle, missionTitle/Description, visionTitle/Description (az/ru).',
  })
  missionVision?: {
    sectionTitle: { az?: string; ru?: string };
    missionTitle: { az?: string; ru?: string };
    missionDescription: { az?: string; ru?: string };
    visionTitle: { az?: string; ru?: string };
    visionDescription: { az?: string; ru?: string };
    imageUrl?: string;
    imageAlt?: { az?: string; ru?: string };
  };
}
