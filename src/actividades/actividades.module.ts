import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actividad } from './entities/actividad.entity';
import { ActividadEvento } from './entities/actividad-evento.entity';
import { ActividadEventoGasto } from './entities/actividad-evento-gasto.entity';
import { ActividadesService } from './actividades.service';
import { ActividadesController } from './actividades.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Actividad, ActividadEvento, ActividadEventoGasto]),
  ],
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService],
})
export class ActividadesModule {}