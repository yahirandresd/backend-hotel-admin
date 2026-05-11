import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requisito } from './entities/requisito.entity';
import { HuespedRequisito } from './entities/huesped-requisito.entity';
import { RequisitosService } from './requisitos.service';
import { RequisitosController } from './requisitos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Requisito, HuespedRequisito])],
  controllers: [RequisitosController],
  providers: [RequisitosService],
  exports: [RequisitosService],
})
export class RequisitosModule {}