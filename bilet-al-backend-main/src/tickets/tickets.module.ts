import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService, TicketsController } from './tickets.service';
import { Ticket, TicketScanLog, SessionSeat, Session, Payment } from '../common/entities/all.entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketScanLog, SessionSeat, Session, Payment]),
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
