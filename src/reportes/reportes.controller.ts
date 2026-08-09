import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Roles } from '../auth/decorators/roles.decorator';

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