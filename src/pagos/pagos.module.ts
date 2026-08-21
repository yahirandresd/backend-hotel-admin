import { Module } from '@nestjs/common';
import { Pago } from './entities/pago.entity';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { tenantRepositoryProvider } from '../database/tenant-repository.provider';

@Module({
  controllers: [PagosController],
  providers: [PagosService, tenantRepositoryProvider(Pago)],
  exports: [PagosService],
})
export class PagosModule {}