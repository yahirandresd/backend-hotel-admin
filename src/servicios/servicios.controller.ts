import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { ServicioResponseDto, toServicioResponse } from './dto/servicio-response.dto';
import { UseGuards } from '@nestjs/common';
import { SupabaseGuard } from 'src/auth/guards/supabase.guard';

@UseGuards(SupabaseGuard)
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  // POST /api/servicios
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateServicioDto): Promise<ServicioResponseDto> {
    const servicio = await this.serviciosService.create(dto);
    return toServicioResponse(servicio);
  }

  // GET /api/servicios
  @Get()
  async findAll(): Promise<ServicioResponseDto[]> {
    const servicios = await this.serviciosService.findAll();
    return servicios.map(toServicioResponse);
  }

  // GET /api/servicios/activos
  @Get('activos')
  async findActivos(): Promise<ServicioResponseDto[]> {
    const servicios = await this.serviciosService.findActivos();
    return servicios.map(toServicioResponse);
  }

  // GET /api/servicios/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ServicioResponseDto> {
    const servicio = await this.serviciosService.findOne(id);
    return toServicioResponse(servicio);
  }

  // PATCH /api/servicios/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServicioDto,
  ): Promise<ServicioResponseDto> {
    const servicio = await this.serviciosService.update(id, dto);
    return toServicioResponse(servicio);
  }

  // DELETE /api/servicios/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.serviciosService.remove(id);
  }
}