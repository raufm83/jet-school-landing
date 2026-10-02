import os

def write_api_files(base_path):
    controller_code = """import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AdvantageService } from './advantage.service';
import { CreateAdvantageDto } from './dto/create-advantage.dto';
import { UpdateAdvantageDto } from './dto/update-advantage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('advantage')
export class AdvantageController {
  constructor(private readonly advantageService: AdvantageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  create(@Body() createAdvantageDto: CreateAdvantageDto) {
    return this.advantageService.create(createAdvantageDto);
  }

  @Get()
  findAll() {
    return this.advantageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.advantageService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  update(@Param('id') id: string, @Body() updateAdvantageDto: UpdateAdvantageDto) {
    return this.advantageService.update(id, updateAdvantageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CONTENTMANAGER)
  remove(@Param('id') id: string) {
    return this.advantageService.remove(id);
  }
}
"""

    service_code = """import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdvantageDto } from './dto/create-advantage.dto';
import { UpdateAdvantageDto } from './dto/update-advantage.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdvantageService {
  constructor(private prisma: PrismaService) {}

  async create(createAdvantageDto: CreateAdvantageDto) {
    return this.prisma.advantage.create({
      data: createAdvantageDto as any,
    });
  }

  async findAll() {
    return this.prisma.advantage.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const advantage = await this.prisma.advantage.findUnique({
      where: { id },
    });
    if (!advantage) throw new NotFoundException('Advantage not found');
    return advantage;
  }

  async update(id: string, updateAdvantageDto: UpdateAdvantageDto) {
    await this.findOne(id);
    return this.prisma.advantage.update({
      where: { id },
      data: updateAdvantageDto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.advantage.delete({
      where: { id },
    });
  }
}
"""

    create_dto = """import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';

export class CreateAdvantageDto {
  @IsObject()
  @IsNotEmpty()
  title: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  description: Record<string, string>;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
"""

    update_dto = """import { PartialType } from '@nestjs/swagger';
import { CreateAdvantageDto } from './create-advantage.dto';

export class UpdateAdvantageDto extends PartialType(CreateAdvantageDto) {}
"""

    module_code = """import { Module } from '@nestjs/common';
import { AdvantageService } from './advantage.service';
import { AdvantageController } from './advantage.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdvantageController],
  providers: [AdvantageService],
})
export class AdvantageModule {}
"""

    advantage_path = os.path.join(base_path, 'src', 'advantage')
    
    with open(os.path.join(advantage_path, 'advantage.controller.ts'), 'w', encoding='utf-8') as f:
        f.write(controller_code)
    
    with open(os.path.join(advantage_path, 'advantage.service.ts'), 'w', encoding='utf-8') as f:
        f.write(service_code)
        
    with open(os.path.join(advantage_path, 'advantage.module.ts'), 'w', encoding='utf-8') as f:
        f.write(module_code)
        
    with open(os.path.join(advantage_path, 'dto', 'create-advantage.dto.ts'), 'w', encoding='utf-8') as f:
        f.write(create_dto)
        
    with open(os.path.join(advantage_path, 'dto', 'update-advantage.dto.ts'), 'w', encoding='utf-8') as f:
        f.write(update_dto)

base_paths = [
    r'c:\Users\amira\OneDrive - Yalova Üniversitesi\Desktop\Jet Teknik Support\jet-school-landing\api',
    r'c:\Users\amira\OneDrive - Yalova Üniversitesi\Desktop\Jet Teknik Support\jet-academy-landing\api'
]

for p in base_paths:
    write_api_files(p)
