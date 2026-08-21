import {
  Controller, Get, Post, Patch,
  Body, Param, ParseIntPipe, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { UpdateHotelMeDto } from './dto/update-hotel-me.dto';
import { HotelResponseDto, toHotelResponse } from './dto/hotel-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('superadmin')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  // GET /api/hotels/me — el propio hotel del admin/staff que llama
  @Roles('admin', 'staff')
  @Get('me')
  async findMe(@Req() req: Request): Promise<HotelResponseDto> {
    const hotelId = (req as any).user.hotelId;
    const hotel = await this.hotelService.findOne(hotelId);
    return toHotelResponse(hotel);
  }

  // PATCH /api/hotels/me — el admin edita su propio hotel (campos restringidos)
  @Roles('admin')
  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateHotelMeDto,
  ): Promise<HotelResponseDto> {
    const hotelId = (req as any).user.hotelId;
    const hotel = await this.hotelService.updateMe(hotelId, dto);
    return toHotelResponse(hotel);
  }

  // POST /api/hotels
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateHotelDto): Promise<HotelResponseDto> {
    const hotel = await this.hotelService.create(dto);
    return toHotelResponse(hotel);
  }

  // GET /api/hotels
  @Get()
  async findAll(): Promise<HotelResponseDto[]> {
    const hoteles = await this.hotelService.findAll();
    return hoteles.map(toHotelResponse);
  }

  // GET /api/hotels/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<HotelResponseDto> {
    const hotel = await this.hotelService.findOne(id);
    return toHotelResponse(hotel);
  }

  // PATCH /api/hotels/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHotelDto,
  ): Promise<HotelResponseDto> {
    const hotel = await this.hotelService.update(id, dto);
    return toHotelResponse(hotel);
  }

  // Sin DELETE — soft delete vía PATCH { activo: false }. Un hard delete
  // borraría en cascada el historial completo de un cliente.
}
