import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './entities/guest.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { HabitacionModule } from '../habitacion/habitacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, HuespedReservacion]),
    HabitacionModule,
  ],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}
