import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from './entities/reservation.entity';
import { GuestsModule } from '../guests/guests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    GuestsModule, // 👈 ya no necesita Guest directo, lo hereda de GuestsModule
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}