import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, ValidateNested, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class BlogCategoryNameDto {
  @ApiProperty({ description: 'Name in Azerbaijani' })
  @IsString()
  az: string;

  @ApiProperty({ description: 'Name in Russian' })
  @IsString()
  ru: string;
}

export class CreateBlogCategoryDto {
  @ApiProperty({ type: BlogCategoryNameDto })
  @ValidateNested()
  @Type(() => BlogCategoryNameDto)
  name: BlogCategoryNameDto;

  @ApiPropertyOptional({ description: 'Display order (0-based)', example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;
}
