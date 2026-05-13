import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './entities/guest.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, HuespedReservacion, Habitacion])],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}