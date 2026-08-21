import { Module } from '@nestjs/common';
import { Guest } from './entities/guest.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { HabitacionModule } from '../habitacion/habitacion.module';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  imports: [HabitacionModule],
  controllers: [GuestsController],
  providers: [
    GuestsService,
    tenantRepositoryProvider(Guest),
    tenantRepositoryProvider(HuespedReservacion),
  ],
  exports: [GuestsService],
})
export class GuestsModule {}
