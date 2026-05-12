import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReportesService } from './reportes.service';

import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(SupabaseGuard, RolesGuard)
@Roles('admin')
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
  ) {}

  @Get('reservaciones')
  reporteReservaciones(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteReservaciones(
      desde,
      hasta,
    );
  }

  @Get('ingresos')
  reporteIngresos(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteIngresos(
      desde,
      hasta,
    );
  }

  @Get('ocupacion')
  reporteOcupacion() {
    return this.reportesService.reporteOcupacion();
  }

  @Get('actividades')
  reporteActividades(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteActividades(
      desde,
      hasta,
    );
  }

  @Get('general')
  reporteGeneral(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteGeneral(
      desde,
      hasta,
    );
  }
}