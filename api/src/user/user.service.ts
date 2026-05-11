import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Database query failed:', error);
      }
      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  }

  private normalizeNameI18n(
    value: Record<string, string> | string | null | undefined,
  ): { az: string; ru: string } | null {
    if (value == null) return null;
    if (typeof value === 'string') {
      const t = value.trim();
      return t ? { az: t, ru: t } : null;
    }
    const az = (value as Record<string, string>).az?.trim() ?? '';
    const ru = (value as Record<string, string>).ru?.trim() ?? '';
    return az || ru ? { az, ru } : null;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const firstName = this.normalizeNameI18n(user.firstName as Record<string, string> | string | null);
    const lastName = this.normalizeNameI18n(user.lastName as Record<string, string> | string | null);
    return { ...user, firstName, lastName };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email) {
      const userWithEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (userWithEmail && userWithEmail.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    const { profession, avatarUrl, firstName, lastName, ...userData } = updateUserDto as UpdateUserDto & {
      profession?: Record<string, string>;
      avatarUrl?: string;
      firstName?: Record<string, string>;
      lastName?: Record<string, string>;
    };
    const data: any = { ...userData };
    if (updateUserDto.password) {
      data.password = await hash(updateUserDto.password, 12);
    }
    const existingFirst = existingUser.firstName as Record<string, string> | string | null | undefined;
    const existingLast = existingUser.lastName as Record<string, string> | string | null | undefined;
    if (firstName !== undefined) {
      const normalized = typeof firstName === 'object' && firstName !== null
        ? { az: firstName.az?.trim() ?? '', ru: firstName.ru?.trim() ?? '' }
        : null;
      data.firstName = normalized && (normalized.az || normalized.ru) ? normalized : null;
    }
    if (lastName !== undefined) {
      const normalized = typeof lastName === 'object' && lastName !== null
        ? { az: lastName.az?.trim() ?? '', ru: lastName.ru?.trim() ?? '' }
        : null;
      data.lastName = normalized && (normalized.az || normalized.ru) ? normalized : null;
    }
    if (firstName !== undefined || lastName !== undefined) {
      const firstObj = (data.firstName ?? existingFirst) as Record<string, string> | string | null | undefined;
      const lastObj = (data.lastName ?? existingLast) as Record<string, string> | string | null | undefined;
      const firstStr = typeof firstObj === 'object' && firstObj && (firstObj.az || firstObj.ru)
        ? (firstObj.az || firstObj.ru)
        : typeof firstObj === 'string' ? firstObj : '';
      const lastStr = typeof lastObj === 'object' && lastObj && (lastObj.az || lastObj.ru)
        ? (lastObj.az || lastObj.ru)
        : typeof lastObj === 'string' ? lastObj : '';
      data.name = [firstStr, lastStr].filter(Boolean).join(' ') || existingUser.name;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });

    if (profession !== undefined || avatarUrl !== undefined) {
      const profilePayload: { profession?: Record<string, string>; avatarUrl?: string } = {};
      if (profession !== undefined && typeof profession === 'object' && profession !== null) {
        const norm = { az: (profession.az ?? '').trim(), ru: (profession.ru ?? '').trim() };
        if (norm.az || norm.ru) profilePayload.profession = norm;
      }
      if (avatarUrl !== undefined) profilePayload.avatarUrl = avatarUrl;

      if (updated.profile) {
        await this.prisma.profile.update({
          where: { userId: id },
          data: profilePayload,
        });
      } else {
        await this.prisma.profile.create({
          data: {
            userId: id,
            ...profilePayload,
          },
        });
      }
    }

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
