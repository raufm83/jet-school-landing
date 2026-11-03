import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CreateGalleryDto } from './create-gallery.dto';

export class UpdateGalleryDto extends PartialType(CreateGalleryDto) {
  @ApiProperty({ required: false, description: 'Display order' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ required: false, description: 'Show on home page (max 3)' })
  @IsOptional()
  @IsBoolean()
  showOnHome?: boolean;
}
