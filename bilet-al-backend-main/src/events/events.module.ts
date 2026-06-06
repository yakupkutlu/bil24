import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService, EventsController, SessionsService, SessionsController, VenuesService, VenuesController } from './events.service';
import { Event, Session, Venue, Seat, SessionSeat, SessionPriceCategory } from '../common/entities/all.entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Session, Venue, Seat, SessionSeat, SessionPriceCategory]),
    CloudinaryModule,
  ],
  controllers: [EventsController, SessionsController, VenuesController],
  providers: [EventsService, SessionsService, VenuesService],
  exports: [EventsService, SessionsService, VenuesService],
})
export class EventsModule {}
