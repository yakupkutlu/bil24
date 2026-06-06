// ============================================================
// REPORTS SERVICE & CONTROLLER
// ============================================================

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { Ticket, Payment, Session } from '../common/entities/all.entities';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/auth.module';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Session) private sessionsRepo: Repository<Session>,
    private dataSource: DataSource,
  ) {}

  async getDailySales(from: string, to: string) {
    return this.dataSource.query(`
      SELECT
        DATE(p.created_at) as sale_date,
        COUNT(t.id) as ticket_count,
        SUM(p.amount) as total_amount,
        SUM(p.vat_amount) as total_vat,
        SUM(p.commission_amount) as total_commission,
        SUM(p.net_amount) as total_net,
        COUNT(CASE WHEN p.method = 'credit_card' THEN 1 END) as credit_card_count,
        COUNT(CASE WHEN p.method = 'cash' THEN 1 END) as cash_count,
        COUNT(CASE WHEN p.method = 'bank_transfer' THEN 1 END) as transfer_count,
        SUM(CASE WHEN p.method = 'credit_card' THEN p.amount ELSE 0 END) as credit_card_amount,
        SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END) as cash_amount,
        SUM(CASE WHEN p.method = 'bank_transfer' THEN p.amount ELSE 0 END) as transfer_amount
      FROM payments p
      JOIN tickets t ON t.payment_id = p.id
      WHERE p.status = 'completed'
        AND DATE(p.created_at) BETWEEN $1 AND $2
      GROUP BY DATE(p.created_at)
      ORDER BY sale_date DESC
    `, [from, to]);
  }

  async getOccupancyReport(sessionId?: string) {
    const qb = this.sessionsRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.event', 'event')
      .leftJoinAndSelect('s.venue', 'venue')
      .select([
        's.id',
        's.sessionDate',
        's.startTime',
        's.totalCapacity',
        's.soldCount',
        's.reservedCount',
        'event.title',
        'venue.name',
      ])
      .addSelect('ROUND((s.soldCount::DECIMAL / NULLIF(s.totalCapacity, 0)) * 100, 2)', 'occupancy_rate');

    if (sessionId) qb.where('s.id = :sessionId', { sessionId });
    qb.orderBy('s.sessionDate', 'DESC');
    return qb.getRawMany();
  }

  async getRevenueByEvent(from: string, to: string) {
    return this.dataSource.query(`
      SELECT
        e.id as event_id,
        e.title as event_title,
        COUNT(t.id) as ticket_count,
        SUM(t.total_price) as total_revenue,
        SUM(t.vat_amount) as total_vat,
        SUM(t.commission_amount) as total_commission,
        AVG(t.total_price) as avg_ticket_price
      FROM tickets t
      JOIN sessions s ON s.id = t.session_id
      JOIN events e ON e.id = s.event_id
      WHERE t.status = 'active'
        AND DATE(t.created_at) BETWEEN $1 AND $2
      GROUP BY e.id, e.title
      ORDER BY total_revenue DESC
    `, [from, to]);
  }

  async getSummaryStats() {
    const [totalTickets, totalRevenue, activeEvents, upcomingSessions] = await Promise.all([
      this.ticketsRepo.count({ where: { status: 'active' } }),
      this.paymentsRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.status = :s', { s: 'completed' })
        .getRawOne(),
      this.dataSource.query(`SELECT COUNT(*) FROM events WHERE status = 'published'`),
      this.dataSource.query(`
        SELECT COUNT(*) FROM sessions
        WHERE status = 'scheduled' AND session_date >= CURRENT_DATE
      `),
    ]);

    return {
      totalTickets,
      totalRevenue: totalRevenue?.total || 0,
      activeEvents: parseInt(activeEvents[0]?.count || '0'),
      upcomingSessions: parseInt(upcomingSessions[0]?.count || '0'),
    };
  }

  async getUserActivity(from: string, to: string) {
    return this.dataSource.query(`
      SELECT
        DATE(t.created_at) as date,
        COUNT(DISTINCT t.owner_user_id) as unique_buyers,
        COUNT(t.id) as tickets_sold
      FROM tickets t
      WHERE t.status != 'cancelled'
        AND DATE(t.created_at) BETWEEN $1 AND $2
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `, [from, to]);
  }
}

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('operator', 'super_admin')
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  getSummary() {
    return this.reportsService.getSummaryStats();
  }

  @Get('daily-sales')
  getDailySales(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.reportsService.getDailySales(from || thirtyDaysAgo, to || today);
  }

  @Get('occupancy')
  getOccupancy(@Query('sessionId') sessionId: string) {
    return this.reportsService.getOccupancyReport(sessionId);
  }

  @Get('revenue-by-event')
  getRevenueByEvent(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.reportsService.getRevenueByEvent(from || thirtyDaysAgo, to || today);
  }

  @Get('user-activity')
  getUserActivity(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.reportsService.getUserActivity(from || thirtyDaysAgo, to || today);
  }
}
