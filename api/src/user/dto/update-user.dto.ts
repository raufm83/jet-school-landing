import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`])[A-Za-z\d@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`]{8,}$/;

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Ad dillər üzrə (müəllif üçün): { az?: string, ru?: string }',
  })
  @IsOptional()
  firstName?: Record<string, string>;

  @ApiProperty({
    required: false,
    description: 'Soyad dillər üzrə (müəllif üçün): { az?: string, ru?: string }',
  })
  @IsOptional()
  lastName?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Şifrə ən azı 8 simvol olmalıdır' })
  @Matches(PASSWORD_REGEX, {
    message: 'Şifrədə ən azı 1 böyük hərf, 1 kiçik hərf, 1 rəqəm və 1 xüsusi simvol olmalıdır',
  })
  password?: string;

  @ApiProperty({ required: false, enum: Role })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false, description: 'İxtisas dillər üzrə: { az?, ru? }' })
  @IsObject()
  @IsOptional()
  profession?: Record<string, string>;

  @ApiProperty({ required: false, description: 'Profil şəkil yolu' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
