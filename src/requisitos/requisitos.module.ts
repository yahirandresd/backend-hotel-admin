import { Module } from '@nestjs/common';
import { Requisito } from './entities/requisito.entity';
import { HuespedRequisito } from './entities/huesped-requisito.entity';
import { RequisitosService } from './requisitos.service';
import { RequisitosController } from './requisitos.controller';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [RequisitosController],
  providers: [
    RequisitosService,
    tenantRepositoryProvider(Requisito),
    tenantRepositoryProvider(HuespedRequisito),
  ],
  exports: [RequisitosService],
})
export class RequisitosModule {}