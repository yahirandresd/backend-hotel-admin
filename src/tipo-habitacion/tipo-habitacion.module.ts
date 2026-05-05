import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoHabitacion } from './entities/tipo-habitacion.entity';
import { TipoHabitacionService } from './tipo-habitacion.service';
import { TipoHabitacionController } from './tipo-habitacion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoHabitacion])],
  controllers: [TipoHabitacionController],
  providers: [TipoHabitacionService],
  exports: [TipoHabitacionService],
})
export class TipoHabitacionModule {}