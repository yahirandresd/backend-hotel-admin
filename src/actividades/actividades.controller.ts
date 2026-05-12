import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { CreateActividadEventoDto } from './dto/create-actividad-evento.dto';
import { UpdateActividadEventoDto } from './dto/update-actividad-evento.dto';
import {
  toActividadResponse, toEventoResponse,
} from './dto/actividad-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('actividades')
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  // ── Actividades ───────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateActividadDto) {
    const actividad = await this.actividadesService.create(dto);
    return toActividadResponse(actividad);
  }

  @Get()
  async findAll() {
    const actividades = await this.actividadesService.findAll();
    return actividades.map(toActividadResponse);
  }

  @Get('activas')
  async findActivas() {
    const actividades = await this.actividadesService.findActivas();
    return actividades.map(toActividadResponse);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const actividad = await this.actividadesService.findOne(id);
    return toActividadResponse(actividad);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
  ) {
    const actividad = await this.actividadesService.update(id, dto);
    return toActividadResponse(actividad);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.actividadesService.remove(id);
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  @Post('eventos')
  @HttpCode(HttpStatus.CREATED)
  async createEvento(@Body() dto: CreateActividadEventoDto) {
    const evento = await this.actividadesService.createEvento(dto);
    return toEventoResponse(evento);
  }

  @Get(':id/eventos')
  async findEventos(@Param('id', ParseIntPipe) id: number) {
    const eventos = await this.actividadesService.findEventos(id);
    return eventos.map((e) => toEventoResponse(e));
  }

  @Get('eventos/:id')
  async findEvento(@Param('id', ParseIntPipe) id: number) {
    const evento = await this.actividadesService.findEvento(id);
    return toEventoResponse(evento);
  }

  @Patch('eventos/:id')
  async updateEvento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadEventoDto,
  ) {
    const evento = await this.actividadesService.updateEvento(id, dto);
    return toEventoResponse(evento);
  }

  @Delete('eventos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEvento(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.actividadesService.removeEvento(id);
  }

  @Get('eventos/:id/utilidad')
  async utilidad(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.calcularUtilidadEvento(id);
  }
}