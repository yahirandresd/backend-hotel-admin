import {
  Controller, Get, Patch, Delete,
  Param, Body, Req, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { GuestsService } from './guests.service';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestResponseDto, toGuestResponse } from './dto/guest-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  // GET /api/guests
  @Get()
  async findAll(@Req() req: Request): Promise<GuestResponseDto[]> {
    const guests = await this.guestsService.findAll((req as any).user.hotelId);
    return guests.map(toGuestResponse);
  }

  // GET /api/guests/reservation/:reservationId
  @Get('reservation/:reservationId')
  async findByReservation(
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @Req() req: Request,
  ): Promise<GuestResponseDto[]> {
    const guests = await this.guestsService.findByReservation(reservationId, (req as any).user.hotelId);
    return guests.map(toGuestResponse);
  }

  // GET /api/guests/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<GuestResponseDto> {
    const guest = await this.guestsService.findOne(id, (req as any).user.hotelId);
    return toGuestResponse(guest);
  }

  // PATCH /api/guests/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGuestDto,
    @Req() req: Request,
  ): Promise<GuestResponseDto> {
    const guest = await this.guestsService.update(id, dto, (req as any).user.hotelId);
    return toGuestResponse(guest);
  }

  // DELETE /api/guests/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.guestsService.remove(id, (req as any).user.hotelId);
  }
}
