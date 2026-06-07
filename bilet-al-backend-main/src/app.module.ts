import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import {
  User, RefreshToken, SystemSetting,
  Venue, Seat, Event, Session, SessionPriceCategory,
  SessionSeat, Payment, Ticket, TicketScanLog,
  Notification, AuditLog,
} from './common/entities/all.entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'bilet_sistemi',
      entities: [User, RefreshToken, SystemSetting, Venue, Seat, Event, Session, SessionPriceCategory, SessionSeat, Payment, Ticket, TicketScanLog, Notification, AuditLog],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    TicketsModule,
    PaymentsModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
    CloudinaryModule,
  ],
})
export class AppModule {}
