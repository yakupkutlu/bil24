import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService, ReportsController } from './reports.service';
import { Ticket, Payment, Session, Event } from '../common/entities/all.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Payment, Session, Event])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
