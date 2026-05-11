import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationLink } from './entities/reservation-link.entity';
import { ReservationLinksService } from './reservation-links.service';
import { ReservationLinksController } from './reservation-links.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationLink])],
  controllers: [ReservationLinksController],
  providers: [ReservationLinksService],
  exports: [ReservationLinksService],
})
export class ReservationLinksModule {}