import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { ReservacionServicio } from './entities/reservacion-servicio.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { ReservacionActividad } from '../actividades/entities/reservacion-actividad.entity';
import { Plan } from '../planes/entities/plan.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationRoomsService } from './reservation-rooms.service';
import { ReservationItemsService } from './reservation-items.service';
import { ReservationPricingService } from './reservation-pricing.service';
import { GuestsModule } from '../guests/guests.module';
import { ReservationLinksModule } from '../reservation-links/reservation-links.module';
import { HabitacionModule } from '../habitacion/habitacion.module';
import { PagosModule } from '../pagos/pagos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      HuespedReservacion,
      ReservacionServicio,
      Servicio,
      ActividadEvento,
      ReservacionActividad,
      Plan,
    ]),
    GuestsModule,
    ReservationLinksModule,
    HabitacionModule,
    PagosModule,
  ],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    ReservationRoomsService,
    ReservationItemsService,
    ReservationPricingService,
  ],
  exports: [ReservationsService],
})
export class ReservationsModule {}
