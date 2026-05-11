import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  name: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  surname: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  image?: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  bio: any;

  imageUrl?: string;
}
