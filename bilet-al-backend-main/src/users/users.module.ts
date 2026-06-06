import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/all.entities';
import * as bcrypt from 'bcrypt';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.module';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findAll(query: any) {
    const { search, role, page = 1, limit = 20 } = query;
    const qb = this.repo.createQueryBuilder('u').orderBy('u.created_at', 'DESC');
    if (search) qb.andWhere('(u.name ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    if (role) qb.andWhere('u.role = :role', { role });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data: data.map(u => this.sanitize(u)), total, page, limit };
  }

  async findOne(id: string) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return this.sanitize(u);
  }

  async create(dto: any) {
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({ ...dto, password_hash: hashed });
    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  async update(id: string, dto: any) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    if (dto.password) { dto.password_hash = await bcrypt.hash(dto.password, 12); delete dto.password; }
    Object.assign(user, dto);
    return this.sanitize(await this.repo.save(user));
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }

  private sanitize(u: User) {
    const { password_hash, ...rest } = u as any;
    return rest;
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
export class UsersController {
  constructor(private svc: UsersService) {}
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
