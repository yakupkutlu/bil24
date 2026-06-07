// ============================================================
// TICKETS MODULE - Service, Controller, QR Generation
// ============================================================

import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketScanLog, Session, SessionSeat, Seat } from '../common/entities/all.entities';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepo: Repository<Ticket>,
    @InjectRepository(TicketScanLog)
    private scanLogsRepo: Repository<TicketScanLog>,
    @InjectRepository(Session)
    private sessionsRepo: Repository<Session>,
    @InjectRepository(SessionSeat)
    private sessionSeatsRepo: Repository<SessionSeat>,
    private dataSource: DataSource,
  ) {}

  // Generate QR Code
  async generateQRCode(ticketId: string, ticketNumber: string): Promise<string> {
    const payload = JSON.stringify({
      id: ticketId,
      tn: ticketNumber,
      ts: Date.now(),
    });
    const toDataURL = QRCode.toDataURL as (text: string, opts: object) => Promise<string>;
    return toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 300,
    });
  }

  // Create ticket(s) - transactional
  async createTickets(dto: CreateTicketsDto, createdBy: string): Promise<Ticket[]> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(Session, {
        where: { id: dto.sessionId },
        relations: ['event', 'venue'],
      });
      if (!session) throw new NotFoundException('Seans bulunamadı');
      if (session.status !== 'scheduled') throw new BadRequestException('Bu seans için bilet satışı aktif değil');
      const availableCount = session.totalCapacity - session.soldCount - session.reservedCount;
      if (availableCount < dto.seats.length)
        throw new BadRequestException('Yeterli koltuk yok');

      const tickets: Ticket[] = [];

      for (const seatInfo of dto.seats) {
        const ticketId = uuidv4();
        const qrPayload = `TICKET:${ticketId}`;
        const qrCode = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: 'H', width: 300
        });

        // Lock and update session seat
        if (seatInfo.seatId) {
          const sessionSeat = await manager.findOne(SessionSeat, {
            where: { sessionId: dto.sessionId, seatId: seatInfo.seatId },
          });
          if (!sessionSeat || sessionSeat.status !== 'available')
            throw new BadRequestException(`Koltuk ${seatInfo.seatCode} müsait değil`);
          await manager.update(SessionSeat,
            { sessionId: dto.sessionId, seatId: seatInfo.seatId },
            { status: 'occupied', ticketId }
          );
        }

        // Calculate prices
        const vatMultiplier = (session.vatRate / 100);
        const commMultiplier = (session.commissionRate / 100);
        const basePrice = Number(seatInfo.price || session.basePrice);
        const vatAmount = basePrice * vatMultiplier;
        const commissionAmount = basePrice * commMultiplier;
        const totalPrice = basePrice + vatAmount + commissionAmount;

        const ticket = manager.create(Ticket, {
          id: ticketId,
          sessionId: dto.sessionId,
          paymentId: dto.paymentId,
          ownerUserId: dto.userId,
          buyerFirstName: dto.buyerFirstName,
          buyerLastName: dto.buyerLastName,
          buyerEmail: dto.buyerEmail,
          buyerPhone: dto.buyerPhone,
          seatId: seatInfo.seatId,
          seatCode: seatInfo.seatCode,
          seatLabel: seatInfo.seatLabel,
          basePrice,
          vatAmount,
          commissionAmount,
          totalPrice,
          qrCode,
          qrType: dto.qrType || 'single_use',
          status: 'active',
          createdBy,
        });

        await manager.save(ticket);
        tickets.push(ticket);
      }

      // Update session sold count
      await manager.increment(Session, { id: dto.sessionId }, 'soldCount', tickets.length);

      return tickets;
    });
  }

  // Scan/Validate ticket - QR doğrulama
  async scanTicket(qrCode: string, scannedBy: string, ipAddress?: string): Promise<ScanResult> {
    // Extract ticket ID from QR
    const ticketId = qrCode.replace('TICKET:', '');
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
      relations: ['session', 'session.event', 'session.venue', 'seat'],
    });

    if (!ticket) {
      await this.logScan(null, scannedBy, 'invalid', 'Bilet bulunamadı', ipAddress);
      return { success: false, result: 'invalid', message: 'Geçersiz bilet' };
    }

    // Already scanned
    if (ticket.status === 'used') {
      await this.logScan(ticket.id, scannedBy, 'already_used',
        `Daha önce ${ticket.scannedAt?.toLocaleString('tr-TR')} tarihinde okutuldu`, ipAddress);
      return {
        success: false,
        result: 'already_used',
        message: 'Bu bilet daha önce okutuldu',
        ticket: this.sanitizeTicket(ticket),
        scannedAt: ticket.scannedAt,
      };
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      await this.logScan(ticket.id, scannedBy, 'invalid', 'Bilet iptal/iade edilmiş', ipAddress);
      return { success: false, result: 'invalid', message: 'Bu bilet iptal edilmiş' };
    }

    if (ticket.qrType === 'time_limited' && ticket.qrExpiresAt < new Date()) {
      await this.logScan(ticket.id, scannedBy, 'expired', 'QR süresi dolmuş', ipAddress);
      return { success: false, result: 'expired', message: 'Bilet QR kodu süresi dolmuş' };
    }

    // Mark as used
    await this.ticketsRepo.update(ticket.id, {
      status: 'used',
      scannedAt: new Date(),
      scannedBy,
      scanCount: ticket.scanCount + 1,
    });

    await this.logScan(ticket.id, scannedBy, 'success', null, ipAddress);

    return {
      success: true,
      result: 'success',
      message: 'Bilet geçerli',
      ticket: this.sanitizeTicket(ticket),
    };
  }

  private async logScan(ticketId: string | null, scannedBy: string, result: string, notes: string, ipAddress?: string) {
    if (!ticketId) return;
    const log = this.scanLogsRepo.create({ ticketId, scannedBy, scanResult: result as any, scanNotes: notes, ipAddress });
    await this.scanLogsRepo.save(log);
  }

  private sanitizeTicket(ticket: Ticket) {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      buyerName: `${ticket.buyerFirstName} ${ticket.buyerLastName}`,
      seatCode: ticket.seatCode,
      seatLabel: ticket.seatLabel,
      event: ticket.session?.event?.title,
      venue: ticket.session?.venue?.name,
      sessionDate: ticket.session?.sessionDate,
      sessionTime: ticket.session?.startTime,
      status: ticket.status,
      scannedAt: ticket.scannedAt,
    };
  }

  async findAll(filters: any) {
    const qb = this.ticketsRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.session', 'session')
      .leftJoinAndSelect('session.event', 'event')
      .leftJoinAndSelect('session.venue', 'venue')
      .leftJoinAndSelect('ticket.seat', 'seat');

    if (filters.sessionId) qb.andWhere('ticket.sessionId = :sessionId', { sessionId: filters.sessionId });
    if (filters.userId) qb.andWhere('ticket.ownerUserId = :userId', { userId: filters.userId });
    if (filters.status) qb.andWhere('ticket.status = :status', { status: filters.status });
    if (filters.ticketNumber) qb.andWhere('ticket.ticketNumber ILIKE :tn', { tn: `%${filters.ticketNumber}%` });

    qb.orderBy('ticket.createdAt', 'DESC');
    if (filters.limit) qb.limit(filters.limit);
    if (filters.offset) qb.offset(filters.offset);

    const [tickets, total] = await qb.getManyAndCount();
    return { tickets, total };
  }

  async findOne(id: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['session', 'session.event', 'session.venue', 'seat', 'payment', 'scanLogs'],
    });
    if (!ticket) throw new NotFoundException('Bilet bulunamadı');
    return ticket;
  }

  async cancelTicket(id: string, reason: string, cancelledBy: string) {
    const ticket = await this.findOne(id);
    if (ticket.status === 'used') throw new BadRequestException('Kullanılmış bilet iptal edilemez');
    if (ticket.status === 'cancelled') throw new BadRequestException('Bilet zaten iptal edilmiş');

    await this.ticketsRepo.update(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy,
      cancelReason: reason,
    });

    // Free up the seat
    if (ticket.seatId) {
      await this.sessionSeatsRepo.update(
        { sessionId: ticket.sessionId, seatId: ticket.seatId },
        { status: 'available', ticketId: null }
      );
    }

    await this.sessionsRepo.decrement({ id: ticket.sessionId }, 'soldCount', 1);
    return { message: 'Bilet iptal edildi' };
  }

  async getSessionSeatMap(sessionId: string) {
    const sessionSeats = await this.sessionSeatsRepo.find({
      where: { sessionId },
      relations: ['seat'],
    });
    return sessionSeats.map(ss => ({
      seatId: ss.seatId,
      seatCode: ss.seat.seatCode,
      groupLetter: ss.seat.groupLetter,
      rowNumber: ss.seat.rowNumber,
      seatNumber: ss.seat.seatNumber,
      tableNumber: ss.seat.tableNumber,
      status: ss.status,
      isVip: ss.seat.isVip,
      isDisabledAccessible: ss.seat.isDisabledAccessible,
      xPosition: ss.seat.xPosition,
      yPosition: ss.seat.yPosition,
    }));
  }

  async assignSeatToTicket(ticketId: string, seatId: string, operatorId: string) {
    const ticket = await this.findOne(ticketId);
    if (ticket.status !== 'active') throw new BadRequestException('Bu bilet için koltuk atanılamaz');

    const sessionSeat = await this.sessionSeatsRepo.findOne({
      where: { sessionId: ticket.sessionId, seatId },
      relations: ['seat'],
    });
    if (!sessionSeat || sessionSeat.status !== 'available')
      throw new BadRequestException('Bu koltuk müsait değil');

    // Free old seat if exists
    if (ticket.seatId) {
      await this.sessionSeatsRepo.update(
        { sessionId: ticket.sessionId, seatId: ticket.seatId },
        { status: 'available', ticketId: null }
      );
    }

    // Assign new seat
    await this.sessionSeatsRepo.update(
      { sessionId: ticket.sessionId, seatId },
      { status: 'occupied', ticketId }
    );

    await this.ticketsRepo.update(ticketId, {
      seatId,
      seatCode: sessionSeat.seat.seatCode,
    });

    return { message: 'Koltuk atandı' };
  }
}

// DTO
export class CreateTicketsDto {
  sessionId: string;
  paymentId?: string;
  userId?: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  qrType?: 'single_use' | 'time_limited';
  seats: {
    seatId?: string;
    seatCode?: string;
    seatLabel?: string;
    price?: number;
  }[];
}

export interface ScanResult {
  success: boolean;
  result: 'success' | 'already_used' | 'invalid' | 'expired';
  message: string;
  ticket?: any;
  scannedAt?: Date;
}

// Controller
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @Roles('operator', 'super_admin')
  findAll(@Query() query: any) {
    return this.ticketsService.findAll(query);
  }

  @Get('my')
  getMyTickets(@Req() req: any) {
    return this.ticketsService.findAll({ userId: req.user.id });
  }

  @Get('session/:sessionId/seatmap')
  @Roles('operator', 'super_admin', 'customer')
  getSessionSeatMap(@Param('sessionId') sessionId: string) {
    return this.ticketsService.getSessionSeatMap(sessionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @Roles('operator', 'super_admin')
  @ApiOperation({ summary: 'Yeni bilet oluştur' })
  create(@Body() dto: CreateTicketsDto, @Req() req: any) {
    return this.ticketsService.createTickets(dto, req.user.id);
  }

  @Post('scan')
  @Roles('operator', 'super_admin')
  @ApiOperation({ summary: 'QR kod ile bilet doğrula' })
  scan(@Body() body: { qrCode: string }, @Req() req: any) {
    return this.ticketsService.scanTicket(body.qrCode, req.user.id, req.ip);
  }

  @Patch(':id/assign-seat')
  @Roles('operator', 'super_admin')
  assignSeat(@Param('id') id: string, @Body() body: { seatId: string }, @Req() req: any) {
    return this.ticketsService.assignSeatToTicket(id, body.seatId, req.user.id);
  }

  @Delete(':id')
  @Roles('operator', 'super_admin')
  cancel(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    return this.ticketsService.cancelTicket(id, body.reason, req.user.id);
  }
}
