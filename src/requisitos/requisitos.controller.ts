import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequisitosService } from './requisitos.service';
import { CreateRequisitoDto } from './dto/create-requisito.dto';
import { UpdateRequisitoDto } from './dto/update-requisito.dto';
import { CreateHuespedRequisitoDto } from './dto/create-huesped-requisito.dto';
import {
  toRequisitoResponse,
  toHuespedRequisitoResponse,
} from './dto/requisito-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('requisitos')
export class RequisitosController {
  constructor(private readonly requisitosService: RequisitosService) {}

  // ── Requisitos ────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRequisitoDto, @Req() req: Request) {
    const requisito = await this.requisitosService.create(dto, (req as any).user.hotelId);
    return toRequisitoResponse(requisito);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const requisitos = await this.requisitosService.findAll((req as any).user.hotelId);
    return requisitos.map(toRequisitoResponse);
  }

  @Get('activos')
  async findActivos(@Req() req: Request) {
    const requisitos = await this.requisitosService.findActivos((req as any).user.hotelId);
    return requisitos.map(toRequisitoResponse);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const requisito = await this.requisitosService.findOne(id, (req as any).user.hotelId);
    return toRequisitoResponse(requisito);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequisitoDto,
    @Req() req: Request,
  ) {
    const requisito = await this.requisitosService.update(id, dto, (req as any).user.hotelId);
    return toRequisitoResponse(requisito);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.requisitosService.remove(id, (req as any).user.hotelId);
  }

  // ── Huésped Requisito ─────────────────────────────────────────────────────

  @Post('respuestas')
  @HttpCode(HttpStatus.CREATED)
  async registrarRespuesta(@Body() dto: CreateHuespedRequisitoDto, @Req() req: Request) {
    const hr = await this.requisitosService.registrarRespuesta(dto, (req as any).user.hotelId);
    return toHuespedRequisitoResponse(hr);
  }

  @Get('respuestas/reservacion/:id')
  async findByReservacion(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const hrs = await this.requisitosService.findByReservacion(id, (req as any).user.hotelId);
    return hrs.map(toHuespedRequisitoResponse);
  }

  @Get('respuestas/huesped/:id')
  async findByHuesped(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const hrs = await this.requisitosService.findByHuesped(id, (req as any).user.hotelId);
    return hrs.map(toHuespedRequisitoResponse);
  }
}
