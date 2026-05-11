import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // GET /api/reportes/reservaciones?desde=2025-06-01&hasta=2025-06-30
  @Get('reservaciones')
  reporteReservaciones(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteReservaciones(desde, hasta);
  }

  // GET /api/reportes/ingresos?desde=2025-06-01&hasta=2025-06-30
  @Get('ingresos')
  reporteIngresos(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteIngresos(desde, hasta);
  }

  // GET /api/reportes/ocupacion
  @Get('ocupacion')
  reporteOcupacion() {
    return this.reportesService.reporteOcupacion();
  }

  // GET /api/reportes/actividades?desde=2025-06-01&hasta=2025-06-30
  @Get('actividades')
  reporteActividades(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteActividades(desde, hasta);
  }

  // GET /api/reportes/general?desde=2025-06-01&hasta=2025-06-30
  @Get('general')
  reporteGeneral(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.reporteGeneral(desde, hasta);
  }
}