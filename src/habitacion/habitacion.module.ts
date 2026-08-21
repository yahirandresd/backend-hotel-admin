import { Module } from '@nestjs/common';
import { Habitacion } from './entities/habitacion.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { HabitacionService } from './habitacion.service';
import { HabitacionController } from './habitacion.controller';
import { TipoHabitacionModule } from '../tipo-habitacion/tipo-habitacion.module';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  imports: [TipoHabitacionModule],
  controllers: [HabitacionController],
  providers: [
    HabitacionService,
    tenantRepositoryProvider(Habitacion),
    tenantRepositoryProvider(HuespedReservacion),
  ],
  exports: [HabitacionService],
})
export class HabitacionModule {}