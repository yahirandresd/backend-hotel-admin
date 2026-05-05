import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habitacion } from './entities/habitacion.entity';
import { HabitacionService } from './habitacion.service';
import { HabitacionController } from './habitacion.controller';
import { TipoHabitacionModule } from '../tipo-habitacion/tipo-habitacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Habitacion]),
    TipoHabitacionModule,
  ],
  controllers: [HabitacionController],
  providers: [HabitacionService],
  exports: [HabitacionService],
})
export class HabitacionModule {}