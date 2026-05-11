import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RequisitosService } from './requisitos.service';
import { CreateRequisitoDto } from './dto/create-requisito.dto';
import { UpdateRequisitoDto } from './dto/update-requisito.dto';
import { CreateHuespedRequisitoDto } from './dto/create-huesped-requisito.dto';
import {
  toRequisitoResponse,
  toHuespedRequisitoResponse,
} from './dto/requisito-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('requisitos')
export class RequisitosController {
  constructor(private readonly requisitosService: RequisitosService) {}

  // ── Requisitos ────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRequisitoDto) {
    const requisito = await this.requisitosService.create(dto);
    return toRequisitoResponse(requisito);
  }

  @Get()
  async findAll() {
    const requisitos = await this.requisitosService.findAll();
    return requisitos.map(toRequisitoResponse);
  }

  @Get('activos')
  async findActivos() {
    const requisitos = await this.requisitosService.findActivos();
    return requisitos.map(toRequisitoResponse);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const requisito = await this.requisitosService.findOne(id);
    return toRequisitoResponse(requisito);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequisitoDto,
  ) {
    const requisito = await this.requisitosService.update(id, dto);
    return toRequisitoResponse(requisito);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.requisitosService.remove(id);
  }

  // ── Huésped Requisito ─────────────────────────────────────────────────────

  @Post('respuestas')
  @HttpCode(HttpStatus.CREATED)
  async registrarRespuesta(@Body() dto: CreateHuespedRequisitoDto) {
    const hr = await this.requisitosService.registrarRespuesta(dto);
    return toHuespedRequisitoResponse(hr);
  }

  @Get('respuestas/reservacion/:id')
  async findByReservacion(@Param('id', ParseIntPipe) id: number) {
    const hrs = await this.requisitosService.findByReservacion(id);
    return hrs.map(toHuespedRequisitoResponse);
  }

  @Get('respuestas/huesped/:id')
  async findByHuesped(@Param('id', ParseIntPipe) id: number) {
    const hrs = await this.requisitosService.findByHuesped(id);
    return hrs.map(toHuespedRequisitoResponse);
  }
}