import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
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
    @Req() req: Request,
  ) {
    return this.reportesService.reporteReservaciones(desde, hasta, (req as any).user.hotelId);
  }

  @Get('ingresos')
  reporteIngresos(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Req() req: Request,
  ) {
    return this.reportesService.reporteIngresos(desde, hasta, (req as any).user.hotelId);
  }

  @Get('ocupacion')
  reporteOcupacion(@Req() req: Request) {
    return this.reportesService.reporteOcupacion((req as any).user.hotelId);
  }

  @Get('general')
  reporteGeneral(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Req() req: Request,
  ) {
    return this.reportesService.reporteGeneral(desde, hasta, (req as any).user.hotelId);
  }
}
