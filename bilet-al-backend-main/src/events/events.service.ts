// ============================================================
// EVENTS SERVICE & CONTROLLER
// ============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../common/entities/all.entities';
import {
  Controller, Get, Post, Put, Delete, Param, Body,
  Query, UseGuards, Req, UseInterceptors, UploadedFiles
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/auth.module';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepo: Repository<Event>,
  ) {}

  async findAll(filters: {
    status?: string; category?: string; search?: string;
    isFeatured?: boolean; page?: number; limit?: number;
  }) {
    const qb = this.eventsRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.sessions', 'sessions')
      .leftJoinAndSelect('sessions.venue', 'venue');

    if (filters.status) qb.andWhere('event.status = :status', { status: filters.status });
    if (filters.category) qb.andWhere('event.category = :category', { category: filters.category });
    if (filters.isFeatured !== undefined) qb.andWhere('event.isFeatured = :featured', { featured: filters.isFeatured });
    if (filters.search) qb.andWhere('(event.title ILIKE :q OR event.description ILIKE :q)', { q: `%${filters.search}%` });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('event.createdAt', 'DESC');

    const [events, total] = await qb.getManyAndCount();
    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(idOrSlug: string) {
    const event = await this.eventsRepo.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
      relations: ['sessions', 'sessions.venue'],
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');
    return event;
  }

  async create(dto: any, createdBy: string) {
    const event = this.eventsRepo.create({ ...dto, createdBy });
    return this.eventsRepo.save(event);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.eventsRepo.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.eventsRepo.delete(id);
    return { message: 'Etkinlik silindi' };
  }

  async getCategories() {
    const result = await this.eventsRepo
      .createQueryBuilder('event')
      .select('DISTINCT event.category', 'category')
      .where('event.category IS NOT NULL')
      .getRawMany();
    return result.map(r => r.category);
  }
}

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.eventsService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  create(@Body() dto: any, @Req() req: any) {
    return this.eventsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  delete(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }
}

// ============================================================
// SESSIONS SERVICE & CONTROLLER
// ============================================================

import { Session, SessionSeat, Seat } from '../common/entities/all.entities';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepo: Repository<Session>,
    @InjectRepository(SessionSeat)
    private sessionSeatsRepo: Repository<SessionSeat>,
    @InjectRepository(Seat)
    private seatsRepo: Repository<Seat>,
    private dataSource: DataSource,
  ) {}

  async findAll(filters: any) {
    const qb = this.sessionsRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.event', 'event')
      .leftJoinAndSelect('s.venue', 'venue');

    if (filters.eventId) qb.andWhere('s.eventId = :eventId', { eventId: filters.eventId });
    if (filters.venueId) qb.andWhere('s.venueId = :venueId', { venueId: filters.venueId });
    if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
    if (filters.dateFrom) qb.andWhere('s.sessionDate >= :from', { from: filters.dateFrom });
    if (filters.dateTo) qb.andWhere('s.sessionDate <= :to', { to: filters.dateTo });

    qb.orderBy('s.sessionDate', 'ASC').addOrderBy('s.startTime', 'ASC');
    return qb.getManyAndCount();
  }

  async findOne(id: string) {
    const session = await this.sessionsRepo.findOne({
      where: { id },
      relations: ['event', 'venue', 'venue.seats'],
    });
    if (!session) throw new NotFoundException('Seans bulunamadı');
    return session;
  }

  async create(dto: any, createdBy: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = manager.create(Session, { ...dto, createdBy });
      await manager.save(session);

      // Auto-create session seats from venue seats
      const seats = await manager.find(Seat, { where: { venueId: dto.venueId } });
      const sessionSeats = seats.map(seat => manager.create(SessionSeat, {
        sessionId: session.id,
        seatId: seat.id,
        status: seat.seatType === 'blocked' ? 'blocked' : 'available',
      }));
      if (sessionSeats.length > 0) {
        await manager.save(SessionSeat, sessionSeats);
      }

      // Update total capacity
      await manager.update(Session, session.id, { totalCapacity: seats.length });
      return session;
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.sessionsRepo.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.sessionsRepo.delete(id);
    return { message: 'Seans silindi' };
  }

  async getCalendarView(month: number, year: number) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    return this.sessionsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.event', 'event')
      .leftJoinAndSelect('s.venue', 'venue')
      .where('s.sessionDate BETWEEN :from AND :to', { from, to })
      .andWhere('s.status != :cancelled', { cancelled: 'cancelled' })
      .orderBy('s.sessionDate', 'ASC')
      .addOrderBy('s.startTime', 'ASC')
      .getMany();
  }
}

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.sessionsService.findAll(query);
  }

  @Get('calendar')
  getCalendar(@Query('month') month: number, @Query('year') year: number) {
    return this.sessionsService.getCalendarView(
      month || new Date().getMonth() + 1,
      year || new Date().getFullYear()
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  create(@Body() dto: any, @Req() req: any) {
    return this.sessionsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) {
    return this.sessionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  delete(@Param('id') id: string) {
    return this.sessionsService.delete(id);
  }
}

// ============================================================
// VENUES SERVICE & CONTROLLER
// ============================================================

import { Venue } from '../common/entities/all.entities';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private venuesRepo: Repository<Venue>,
    @InjectRepository(Seat)
    private seatsRepo: Repository<Seat>,
    private dataSource: DataSource,
  ) {}

  async findAll() {
    return this.venuesRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const venue = await this.venuesRepo.findOne({ where: { id }, relations: ['seats'] });
    if (!venue) throw new NotFoundException('Salon bulunamadı');
    return venue;
  }

  async create(dto: any, createdBy: string) {
    return this.dataSource.transaction(async (manager) => {
      const venue = manager.create(Venue, { ...dto, createdBy });
      await manager.save(venue);
      await this.generateSeats(manager, venue);
      return venue;
    });
  }

  private async generateSeats(manager: any, venue: Venue) {
    const seats = [];

    if (venue.type === 'cinema' && venue.cinemaConfig) {
      for (const group of venue.cinemaConfig.groups || []) {
        for (let row = 1; row <= group.rows; row++) {
          for (let seatNum = 1; seatNum <= group.seatsPerRow; seatNum++) {
            seats.push(manager.create(Seat, {
              venueId: venue.id,
              seatCode: `${group.letter}${row}-${seatNum}`,
              groupLetter: group.letter,
              rowNumber: row,
              seatNumber: seatNum,
              isVip: group.isVip || false,
            }));
          }
        }
      }
    } else if (venue.type === 'table' && venue.tableConfig) {
      for (const table of venue.tableConfig.tables || []) {
        for (let seatNum = 1; seatNum <= table.seats; seatNum++) {
          seats.push(manager.create(Seat, {
            venueId: venue.id,
            seatCode: `${table.number}-${seatNum}`,
            tableNumber: table.number,
            seatNumber: seatNum,
          }));
        }
      }
    }

    if (seats.length > 0) {
      await manager.save(Seat, seats);
      await manager.update(Venue, venue.id, { capacity: seats.length });
    }
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.venuesRepo.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.venuesRepo.update(id, { isActive: false });
    return { message: 'Salon pasife alındı' };
  }
}

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  constructor(private venuesService: VenuesService) {}

  @Get()
  findAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  create(@Body() dto: any, @Req() req: any) {
    return this.venuesService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) {
    return this.venuesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  delete(@Param('id') id: string) {
    return this.venuesService.delete(id);
  }
}
