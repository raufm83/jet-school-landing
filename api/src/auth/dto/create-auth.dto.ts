import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Şifrə: min 8 simvol, ən azı 1 böyük hərf, 1 kiçik hərf, 1 rəqəm, 1 xüsusi simvol */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`])[A-Za-z\d@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`]{8,}$/;

export class CreateAuthDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Ad dillər üzrə (müəllif): { az?, ru? }' })
  @IsObject()
  @IsOptional()
  firstName?: Record<string, string>;

  @ApiProperty({ required: false, description: 'Soyad dillər üzrə (müəllif): { az?, ru? }' })
  @IsObject()
  @IsOptional()
  lastName?: Record<string, string>;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Min 8 simvol, ən azı 1 böyük hərf, 1 kiçik hərf, 1 rəqəm, 1 xüsusi simvol (@$!%*?&# və s.)',
  })
  @IsString()
  @MinLength(8, { message: 'Şifrə ən azı 8 simvol olmalıdır' })
  @Matches(PASSWORD_REGEX, {
    message: 'Şifrədə ən azı 1 böyük hərf, 1 kiçik hərf, 1 rəqəm və 1 xüsusi simvol olmalıdır',
  })
  password: string;

  @ApiProperty({ enum: Role, default: Role.USER })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false, description: 'İxtisas dillər üzrə (müəllif): { az?, ru? }' })
  @IsObject()
  @IsOptional()
  profession?: Record<string, string>;

  @ApiProperty({ required: false, description: 'Profil şəkil yolu (upload-avatar ilə alınır)' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
