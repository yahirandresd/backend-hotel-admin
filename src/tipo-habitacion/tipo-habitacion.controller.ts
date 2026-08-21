import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { TipoHabitacionService } from './tipo-habitacion.service';
import { CreateTipoHabitacionDto } from './dto/create-tipo-habitacion.dto';
import { UpdateTipoHabitacionDto } from './dto/update-tipo-habitacion.dto';
import { TipoHabitacionResponseDto, toTipoHabitacionResponse } from './dto/tipo-habitacion-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('tipo-habitacion')
export class TipoHabitacionController {
  constructor(private readonly tipoHabitacionService: TipoHabitacionService) {}

  // POST /api/tipo-habitacion
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTipoHabitacionDto, @Req() req: Request): Promise<TipoHabitacionResponseDto> {
    const tipo = await this.tipoHabitacionService.create(dto, (req as any).user.hotelId);
    return toTipoHabitacionResponse(tipo);
  }

  // GET /api/tipo-habitacion
  @Get()
  async findAll(@Req() req: Request): Promise<TipoHabitacionResponseDto[]> {
    const tipos = await this.tipoHabitacionService.findAll((req as any).user.hotelId);
    return tipos.map(toTipoHabitacionResponse);
  }

  // GET /api/tipo-habitacion/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<TipoHabitacionResponseDto> {
    const tipo = await this.tipoHabitacionService.findOne(id, (req as any).user.hotelId);
    return toTipoHabitacionResponse(tipo);
  }

  // PATCH /api/tipo-habitacion/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoHabitacionDto,
    @Req() req: Request,
  ): Promise<TipoHabitacionResponseDto> {
    const tipo = await this.tipoHabitacionService.update(id, dto, (req as any).user.hotelId);
    return toTipoHabitacionResponse(tipo);
  }

  // DELETE /api/tipo-habitacion/:id
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.tipoHabitacionService.remove(id, (req as any).user.hotelId);
  }
}
