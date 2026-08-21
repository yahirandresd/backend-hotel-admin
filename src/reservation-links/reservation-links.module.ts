import { Module } from '@nestjs/common';
import { ReservationLink } from './entities/reservation-link.entity';
import { ReservationLinksService } from './reservation-links.service';
import { ReservationLinksController } from './reservation-links.controller';
import { PublicLinksController } from './public-links.controller';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [ReservationLinksController, PublicLinksController],
  providers: [ReservationLinksService, tenantRepositoryProvider(ReservationLink)],
  exports: [ReservationLinksService],
})
export class ReservationLinksModule {}