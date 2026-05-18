import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
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
}
