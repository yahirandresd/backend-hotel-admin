import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TipoHabitacionService } from './tipo-habitacion.service';
import { CreateTipoHabitacionDto } from './dto/create-tipo-habitacion.dto';
import { UpdateTipoHabitacionDto } from './dto/update-tipo-habitacion.dto';
import { TipoHabitacionResponseDto, toTipoHabitacionResponse } from './dto/tipo-habitacion-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('tipo-habitacion')
export class TipoHabitacionController {
  constructor(private readonly tipoHabitacionService: TipoHabitacionService) {}

  // POST /api/tipo-habitacion
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTipoHabitacionDto): Promise<TipoHabitacionResponseDto> {
    const tipo = await this.tipoHabitacionService.create(dto);
    return toTipoHabitacionResponse(tipo);
  }

  // GET /api/tipo-habitacion
  @Get()
  async findAll(): Promise<TipoHabitacionResponseDto[]> {
    const tipos = await this.tipoHabitacionService.findAll();
    return tipos.map(toTipoHabitacionResponse);
  }

  // GET /api/tipo-habitacion/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TipoHabitacionResponseDto> {
    const tipo = await this.tipoHabitacionService.findOne(id);
    return toTipoHabitacionResponse(tipo);
  }

  // PATCH /api/tipo-habitacion/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoHabitacionDto,
  ): Promise<TipoHabitacionResponseDto> {
    const tipo = await this.tipoHabitacionService.update(id, dto);
    return toTipoHabitacionResponse(tipo);
  }

  // DELETE /api/tipo-habitacion/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tipoHabitacionService.remove(id);
  }
}