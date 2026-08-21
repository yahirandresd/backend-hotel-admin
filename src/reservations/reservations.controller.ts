import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationResponseDto, toReservationResponse } from './dto/reservation-response.dto';
import {
  UpdateEstadoDto,
  AsignarHabitacionDto,
  AsignarPlanDto,
  UpdateReservationAdminDto,
} from './dto/admin-reservation.dto';
import { Roles } from '../auth/decorators/roles.decorator';

// El endpoint público de creación de reserva (sin JWT, vía código de link)
// vive en public-reservations.controller.ts.
@Roles('admin', 'staff')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // ── Admin ─────────────────────────────────────────────────────────────────

  // POST /api/reservations/admin
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(
    @Body() dto: CreateReservationDto,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.createAdmin(dto, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }

  // GET /api/reservations
  @Get()
  async findAll(@Req() req: Request): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationsService.findAll((req as any).user.hotelId);
    return reservations.map(toReservationResponse);
  }

  // GET /api/reservations/:id
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.findOne(id, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }

  // PATCH /api/reservations/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.update(id, dto, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }

  // DELETE /api/reservations/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.reservationsService.remove(id, (req as any).user.hotelId);
  }

  // PATCH /api/reservations/:id/estado
  @Patch(':id/estado')
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.updateEstado(id, dto, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }

  // POST /api/reservations/:id/habitaciones
  @Post(':id/habitaciones')
  @HttpCode(HttpStatus.OK)
  async asignarHabitacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarHabitacionDto,
    @Req() req: Request,
  ) {
    return this.reservationsService.asignarHabitacion(id, dto, (req as any).user.hotelId);
  }

  // GET /api/reservations/:id/habitaciones
  @Get(':id/habitaciones')
  async findAsignaciones(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.reservationsService.findAsignaciones(id, (req as any).user.hotelId);
  }

  // DELETE /api/reservations/:id/habitaciones/:guestId
  @Delete(':id/habitaciones/:guestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desasignarHabitacion(
    @Param('id', ParseIntPipe) id: number,
    @Param('guestId', ParseIntPipe) guestId: number,
    @Req() req: Request,
  ): Promise<void> {
    return this.reservationsService.desasignarHabitacion(id, guestId, (req as any).user.hotelId);
  }

  // GET /api/reservations/:id/desglose
  @Get(':id/desglose')
  calcularDesglose(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.reservationsService.calcularDesglose(id, (req as any).user.hotelId);
  }

  // PATCH /api/reservations/:id/plan
  @Patch(':id/plan')
  async asignarPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarPlanDto,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.asignarPlan(id, dto, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }

  // DELETE /api/reservations/:id/plan
  @Delete(':id/plan')
  @HttpCode(HttpStatus.OK)
  async quitarPlan(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.quitarPlan(id, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }

  // PATCH /api/reservations/:id/admin
  @Patch(':id/admin')
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationAdminDto,
    @Req() req: Request,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.updateAdmin(id, dto, (req as any).user.hotelId);
    return toReservationResponse(reservation);
  }
}
