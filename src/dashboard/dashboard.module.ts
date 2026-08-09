import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Pago,
      Habitacion,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}