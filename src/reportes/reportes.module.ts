import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { ActividadEventoGasto } from '../actividades/entities/actividad-evento-gasto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Pago,
      Habitacion,
      ActividadEvento,
      ActividadEventoGasto,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}