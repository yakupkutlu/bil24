import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/all.entities';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findAll(query: any) {
    const { search, role, page = 1, limit = 20 } = query;
    const qb = this.repo.createQueryBuilder('u').orderBy('u.created_at', 'DESC');
    if (search) qb.andWhere('(u.firstName ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
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
    const user = this.repo.create({ ...dto, passwordHash: hashed });
    const saved = await this.repo.save(user) as unknown as User;
    return this.sanitize(saved);
  }

  async update(id: string, dto: any) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    if (dto.password) {
      dto.passwordHash = await bcrypt.hash(dto.password, 12);
      delete dto.password;
    }
    Object.assign(user, dto);
    return this.sanitize(await this.repo.save(user) as User);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }

  sanitize(u: User) {
    const { passwordHash, refreshTokenHash, ...rest } = u as any;
    return rest;
  }
}
