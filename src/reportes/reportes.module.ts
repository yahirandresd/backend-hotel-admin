import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [ReportesController],
  providers: [
    ReportesService,
    tenantRepositoryProvider(Reservation),
    tenantRepositoryProvider(Pago),
    tenantRepositoryProvider(Habitacion),
  ],
})
export class ReportesModule {}
