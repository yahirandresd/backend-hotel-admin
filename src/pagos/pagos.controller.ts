import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { PagoResponseDto, toPagoResponse } from './dto/pago-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // POST /api/pagos
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePagoDto, @Req() req: Request): Promise<PagoResponseDto> {
    const pago = await this.pagosService.create(dto, (req as any).user.hotelId);
    return toPagoResponse(pago);
  }

  // GET /api/pagos
  @Get()
  async findAll(@Req() req: Request): Promise<PagoResponseDto[]> {
    const pagos = await this.pagosService.findAll((req as any).user.hotelId);
    return pagos.map(toPagoResponse);
  }

  // GET /api/pagos/reservacion/:id
  @Get('reservacion/:id')
  async findByReservacion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<PagoResponseDto[]> {
    const pagos = await this.pagosService.findByReservacion(id, (req as any).user.hotelId);
    return pagos.map(toPagoResponse);
  }

  // GET /api/pagos/reservacion/:id/total
  @Get('reservacion/:id/total')
  async totalPorReservacion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ reservacionId: number; total: number }> {
    const total = await this.pagosService.totalPorReservacion(id, (req as any).user.hotelId);
    return { reservacionId: id, total };
  }

  // GET /api/pagos/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<PagoResponseDto> {
    const pago = await this.pagosService.findOne(id, (req as any).user.hotelId);
    return toPagoResponse(pago);
  }

  // PATCH /api/pagos/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePagoDto,
    @Req() req: Request,
  ): Promise<PagoResponseDto> {
    const pago = await this.pagosService.update(id, dto, (req as any).user.hotelId);
    return toPagoResponse(pago);
  }

  // DELETE /api/pagos/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.pagosService.remove(id, (req as any).user.hotelId);
  }
}
