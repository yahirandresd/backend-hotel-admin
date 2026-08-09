import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /api/dashboard/resumen
  @Get('resumen')
  resumen() {
    return this.dashboardService.resumen();
  }

  // GET /api/dashboard/ingresos-por-mes
  @Get('ingresos-por-mes')
  ingresosPorMes() {
    return this.dashboardService.ingresosPorMes();
  }

  // GET /api/dashboard/reservaciones-por-estado
  @Get('reservaciones-por-estado')
  reservacionesPorEstado() {
    return this.dashboardService.reservacionesPorEstado();
  }

  // GET /api/dashboard/proximas-llegadas
  @Get('proximas-llegadas')
  proximasLlegadas() {
    return this.dashboardService.proximasLlegadas();
  }

  // GET /api/dashboard/proximas-salidas
  @Get('proximas-salidas')
  proximasSalidas() {
    return this.dashboardService.proximasSalidas();
  }
}