import { ApiProperty } from '@nestjs/swagger';

export class UpdateHomeHeroJsonDto {
  @ApiProperty({ description: 'Hero məzmunu (HTML), iki dil' })
  bodyHtml: { az: string; ru: string };

  @ApiProperty({ required: false })
  imageAlt?: { az?: string; ru?: string };

  @ApiProperty({
    required: false,
    description:
      'Mövcud və ya yeni yüklənmiş şəklin server yolu (məs. home-hero/xxx.webp). Göndərilməsə mövcud qeyd saxlanılır.',
  })
  imageUrl?: string;
}
