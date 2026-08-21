import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    tenantRepositoryProvider(Reservation),
    tenantRepositoryProvider(Pago),
    tenantRepositoryProvider(Habitacion),
  ],
})
export class DashboardModule {}
