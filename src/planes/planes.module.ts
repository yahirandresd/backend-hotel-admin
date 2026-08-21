import { Module } from '@nestjs/common';
import { Plan } from './entities/plan.entity';
import { PlanesService } from './planes.service';
import { PlanesController } from './planes.controller';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [PlanesController],
  providers: [PlanesService, tenantRepositoryProvider(Plan)],
  exports: [PlanesService],
})
export class PlanesModule {}