import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationResponseDto, toReservationResponse } from './dto/reservation-response.dto';
import {
  UpdateEstadoDto,
  AsignarHabitacionDto,
  AgregarServicioDto,
  AgregarActividadDto,
  AsignarPlanDto,
  UpdateReservationAdminDto,
} from './dto/admin-reservation.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // ── Cliente ───────────────────────────────────────────────────────────────

  // POST /api/reservations/:code
  @Public()
  @Post(':code')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('code') code: string,
    @Body() dto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.create(dto, code);
    return toReservationResponse(reservation);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  // GET /api/reservations
  @Get()
  async findAll(): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationsService.findAll();
    return reservations.map(toReservationResponse);
  }

  // GET /api/reservations/:id
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.findOne(id);
    return toReservationResponse(reservation);
  }

  // PATCH /api/reservations/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.update(id, dto);
    return toReservationResponse(reservation);
  }

  // DELETE /api/reservations/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reservationsService.remove(id);
  }

  // PATCH /api/reservations/:id/estado
  @Patch(':id/estado')
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.updateEstado(id, dto);
    return toReservationResponse(reservation);
  }

  // POST /api/reservations/:id/habitaciones
  @Post(':id/habitaciones')
  @HttpCode(HttpStatus.OK)
  async asignarHabitacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarHabitacionDto,
  ) {
    return this.reservationsService.asignarHabitacion(id, dto);
  }

  // GET /api/reservations/:id/habitaciones
  @Get(':id/habitaciones')
  async findAsignaciones(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findAsignaciones(id);
  }

  // DELETE /api/reservations/:id/habitaciones/:guestId
  @Delete(':id/habitaciones/:guestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desasignarHabitacion(
    @Param('id', ParseIntPipe) id: number,
    @Param('guestId', ParseIntPipe) guestId: number,
  ): Promise<void> {
    return this.reservationsService.desasignarHabitacion(id, guestId);
  }

  // POST /api/reservations/:id/servicios
  @Post(':id/servicios')
  @HttpCode(HttpStatus.OK)
  async agregarServicio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarServicioDto,
  ): Promise<{ message: string }> {
    await this.reservationsService.agregarServicio(id, dto);
    return { message: 'Servicio agregado correctamente' };
  }

  // POST /api/reservations/:id/actividades
  @Post(':id/actividades')
  @HttpCode(HttpStatus.OK)
  async agregarActividad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarActividadDto,
  ): Promise<{ message: string }> {
    await this.reservationsService.agregarActividad(id, dto);
    return { message: 'Actividad agregada correctamente' };
  }

  // PATCH /api/reservations/:id/plan
  @Patch(':id/plan')
  async asignarPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarPlanDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.asignarPlan(id, dto);
    return toReservationResponse(reservation);
  }

  // PATCH /api/reservations/:id/admin
  @Patch(':id/admin')
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationAdminDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.updateAdmin(id, dto);
    return toReservationResponse(reservation);
  }
}