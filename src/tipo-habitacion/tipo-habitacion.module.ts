import { Module } from '@nestjs/common';
import { TipoHabitacion } from './entities/tipo-habitacion.entity';
import { TipoHabitacionService } from './tipo-habitacion.service';
import { TipoHabitacionController } from './tipo-habitacion.controller';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [TipoHabitacionController],
  providers: [TipoHabitacionService, tenantRepositoryProvider(TipoHabitacion)],
  exports: [TipoHabitacionService],
})
export class TipoHabitacionModule {}