import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      {
        secret: process.env.JWT_SECRET,
      },
    );

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: token,
    };
  }
  async register(createAuthDto: CreateAuthDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createAuthDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await hash(createAuthDto.password, 12);
    const norm = (v: Record<string, string> | undefined) =>
      v && typeof v === 'object'
        ? { az: (v.az ?? '').trim(), ru: (v.ru ?? '').trim() }
        : null;
    const firstNameObj = norm(createAuthDto.firstName);
    const lastNameObj = norm(createAuthDto.lastName);
    const firstStr = firstNameObj && (firstNameObj.az || firstNameObj.ru) ? (firstNameObj.az || firstNameObj.ru) : '';
    const lastStr = lastNameObj && (lastNameObj.az || lastNameObj.ru) ? (lastNameObj.az || lastNameObj.ru) : '';
    const displayName =
      firstStr || lastStr
        ? [firstStr, lastStr].filter(Boolean).join(' ')
        : (createAuthDto.name?.trim() || '');

    const professionObj =
      createAuthDto.profession && typeof createAuthDto.profession === 'object'
        ? { az: (createAuthDto.profession.az ?? '').trim(), ru: (createAuthDto.profession.ru ?? '').trim() }
        : null;
    const hasProfession = professionObj && (professionObj.az || professionObj.ru);

    const user = await this.prisma.user.create({
      data: {
        name: displayName || createAuthDto.name,
        firstName: firstNameObj && (firstNameObj.az || firstNameObj.ru) ? firstNameObj : null,
        lastName: lastNameObj && (lastNameObj.az || lastNameObj.ru) ? lastNameObj : null,
        email: createAuthDto.email,
        password: hashedPassword,
        role: createAuthDto.role || Role.USER,
        profile: {
          create: {
            ...(hasProfession && { profession: professionObj }),
            ...(createAuthDto.avatarUrl != null && createAuthDto.avatarUrl !== '' && { avatarUrl: createAuthDto.avatarUrl }),
          },
        },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return {
      message: 'User created successfully',
      user,
    };
  }
}
