import { Module } from '@nestjs/common';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { Plan } from '../planes/entities/plan.entity';
import { ReservationsController } from './reservations.controller';
import { PublicReservationsController } from './public-reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationRoomsService } from './reservation-rooms.service';
import { ReservationPricingService } from './reservation-pricing.service';
import { GuestsModule } from '../guests/guests.module';
import { ReservationLinksModule } from '../reservation-links/reservation-links.module';
import { HabitacionModule } from '../habitacion/habitacion.module';
import { PagosModule } from '../pagos/pagos.module';
import { tenantRepositoryProvider, requestManagerProvider } from '../database/tenant-repository.provider';

@Module({
  imports: [
    GuestsModule,
    ReservationLinksModule,
    HabitacionModule,
    PagosModule,
  ],
  controllers: [ReservationsController, PublicReservationsController],
  providers: [
    ReservationsService,
    ReservationRoomsService,
    ReservationPricingService,
    tenantRepositoryProvider(Reservation),
    tenantRepositoryProvider(HuespedReservacion),
    tenantRepositoryProvider(Plan),
    requestManagerProvider,
  ],
  exports: [ReservationsService],
})
export class ReservationsModule {}
