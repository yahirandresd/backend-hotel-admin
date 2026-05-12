import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { ReservacionServicio } from './entities/reservacion-servicio.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { GuestsModule } from '../guests/guests.module';
import { ReservationLinksModule } from '../reservation-links/reservation-links.module';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { ReservacionActividad } from '../actividades/entities/reservacion-actividad.entity';
import { Plan } from '../planes/entities/plan.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      HuespedReservacion,
      ReservacionServicio,
      Habitacion,
      Servicio,
      ActividadEvento,
      ReservacionActividad,
      Plan,
      Pago,
    ]),
    GuestsModule,
    ReservationLinksModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}