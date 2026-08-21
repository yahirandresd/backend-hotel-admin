import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /api/dashboard/resumen
  @Get('resumen')
  resumen(@Req() req: Request) {
    return this.dashboardService.resumen((req as any).user.hotelId);
  }

  // GET /api/dashboard/ingresos-por-mes
  @Get('ingresos-por-mes')
  ingresosPorMes(@Req() req: Request) {
    return this.dashboardService.ingresosPorMes((req as any).user.hotelId);
  }

  // GET /api/dashboard/reservaciones-por-estado
  @Get('reservaciones-por-estado')
  reservacionesPorEstado(@Req() req: Request) {
    return this.dashboardService.reservacionesPorEstado((req as any).user.hotelId);
  }

  // GET /api/dashboard/proximas-llegadas
  @Get('proximas-llegadas')
  proximasLlegadas(@Req() req: Request) {
    return this.dashboardService.proximasLlegadas((req as any).user.hotelId);
  }

  // GET /api/dashboard/proximas-salidas
  @Get('proximas-salidas')
  proximasSalidas(@Req() req: Request) {
    return this.dashboardService.proximasSalidas((req as any).user.hotelId);
  }
}
