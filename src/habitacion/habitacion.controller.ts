import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { HabitacionService } from './habitacion.service';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { HabitacionResponseDto, toHabitacionResponse } from './dto/habitacion-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('habitacion')
export class HabitacionController {
  constructor(private readonly habitacionService: HabitacionService) {}

  // POST /api/habitacion
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateHabitacionDto, @Req() req: Request): Promise<HabitacionResponseDto> {
    const habitacion = await this.habitacionService.create(dto, (req as any).user.hotelId);
    return toHabitacionResponse(habitacion);
  }

  // GET /api/habitacion
  @Get()
  async findAll(@Req() req: Request): Promise<HabitacionResponseDto[]> {
    const habitaciones = await this.habitacionService.findAll((req as any).user.hotelId);
    return habitaciones.map(toHabitacionResponse);
  }

  // GET /api/habitacion/disponibles
  // GET /api/habitacion/disponibles?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
  @Get('disponibles')
  async findDisponibles(
    @Req() req: Request,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<HabitacionResponseDto[]> {
    const habitaciones = await this.habitacionService.findDisponibles((req as any).user.hotelId, desde, hasta);
    return habitaciones.map(toHabitacionResponse);
  }

  // GET /api/habitacion/ocupacion?fecha=YYYY-MM-DD                                    ← detalle de un día
  // GET /api/habitacion/ocupacion?desde=YYYY-MM-DD&hasta=YYYY-MM-DD                   ← agregado por día (puntos del calendario)
  // GET /api/habitacion/ocupacion?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&detalle=true      ← detalle de asignaciones para todo el rango (mes completo, sin 1 request por día)
  @Get('ocupacion')
  findOcupacion(
    @Req() req: Request,
    @Query('fecha') fecha?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('detalle') detalle?: string,
  ) {
    const hotelId = (req as any).user.hotelId;
    if (desde || hasta) {
      if (detalle === 'true') {
        return this.habitacionService.findOcupacionDetalleRango(desde!, hasta!, hotelId);
      }
      return this.habitacionService.findOcupacionRango(desde!, hasta!, hotelId);
    }
    return this.habitacionService.findOcupacion(fecha!, hotelId);
  }

  // GET /api/habitacion/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<HabitacionResponseDto> {
    const habitacion = await this.habitacionService.findOne(id, (req as any).user.hotelId);
    return toHabitacionResponse(habitacion);
  }

  // PATCH /api/habitacion/:id
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHabitacionDto,
    @Req() req: Request,
  ): Promise<HabitacionResponseDto> {
    const habitacion = await this.habitacionService.update(id, dto, (req as any).user.hotelId);
    return toHabitacionResponse(habitacion);
  }

  // DELETE /api/habitacion/:id
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.habitacionService.remove(id, (req as any).user.hotelId);
  }
}
