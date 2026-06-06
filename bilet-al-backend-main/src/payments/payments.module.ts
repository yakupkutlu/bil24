import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../common/entities/all.entities';
import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.module';

@Injectable()
export class PaymentsService {
  constructor(@InjectRepository(Payment) private repo: Repository<Payment>) {}

  async findAll(query: any) {
    const { status, method, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.ticket', 'ticket')
      .orderBy('p.created_at', 'DESC');

    if (status) qb.andWhere('p.status = :status', { status });
    if (method) qb.andWhere('p.payment_method = :method', { method });
    if (dateFrom) qb.andWhere('p.created_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('p.created_at <= :dateTo', { dateTo: new Date(dateTo + 'T23:59:59') });

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    const summaryQb = this.repo.createQueryBuilder('p').select([
      'SUM(p.amount) as total',
      "SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END) as cash",
      "SUM(CASE WHEN p.payment_method = 'credit_card' THEN p.amount ELSE 0 END) as credit_card",
      "SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN p.amount ELSE 0 END) as bank_transfer",
    ]).where("p.status = 'completed'");
    const summary = await summaryQb.getRawOne();

    return { data, total, page, limit, summary };
  }

  async refund(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException();
    p.status = 'refunded';
    return this.repo.save(p);
  }

  async updateStatus(id: string, dto: { status: string }) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException();
    p.status = dto.status as any;
    return this.repo.save(p);
  }
}

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'operator')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Patch(':id/refund') refund(@Param('id') id: string) { return this.svc.refund(id); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() dto: any) { return this.svc.updateStatus(id, dto); }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
