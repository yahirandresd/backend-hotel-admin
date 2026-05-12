import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
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
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateHabitacionDto): Promise<HabitacionResponseDto> {
    const habitacion = await this.habitacionService.create(dto);
    return toHabitacionResponse(habitacion);
  }

  // GET /api/habitacion
  @Get()
  async findAll(): Promise<HabitacionResponseDto[]> {
    const habitaciones = await this.habitacionService.findAll();
    return habitaciones.map(toHabitacionResponse);
  }

  // GET /api/habitacion/disponibles
  @Get('disponibles')
  async findDisponibles(): Promise<HabitacionResponseDto[]> {
    const habitaciones = await this.habitacionService.findDisponibles();
    return habitaciones.map(toHabitacionResponse);
  }

  // GET /api/habitacion/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<HabitacionResponseDto> {
    const habitacion = await this.habitacionService.findOne(id);
    return toHabitacionResponse(habitacion);
  }

  // PATCH /api/habitacion/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHabitacionDto,
  ): Promise<HabitacionResponseDto> {
    const habitacion = await this.habitacionService.update(id, dto);
    return toHabitacionResponse(habitacion);
  }

  // DELETE /api/habitacion/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.habitacionService.remove(id);
  }
}