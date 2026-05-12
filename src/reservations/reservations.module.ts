import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { GuestsModule } from '../guests/guests.module';
import { ReservationLinksModule } from '../reservation-links/reservation-links.module';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { Plan } from '../planes/entities/plan.entity';
import { ReservacionActividad } from 'src/actividades/entities/reservacion-actividad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      HuespedReservacion,  
      Habitacion,
      Servicio,
      ActividadEvento,
      ReservacionActividad,
      Plan,
    ]),
    GuestsModule,
    ReservationLinksModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}