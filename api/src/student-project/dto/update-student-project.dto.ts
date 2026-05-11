import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateStudentProjectDto } from './create-student-project.dto';

export class UpdateStudentProjectDto extends PartialType(
  CreateStudentProjectDto,
) {
  @ApiProperty({ required: false, description: 'Display order' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
