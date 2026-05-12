import {
  Controller, Get, Patch, Delete,
  Param, Body, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestResponseDto, toGuestResponse } from './dto/guest-response.dto';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(SupabaseGuard)
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  // GET /api/guests
  @Get()
  async findAll(): Promise<GuestResponseDto[]> {
    const guests = await this.guestsService.findAll();
    return guests.map(toGuestResponse);
  }

  // GET /api/guests/reservation/:reservationId
  @Get('reservation/:reservationId')
  async findByReservation(
    @Param('reservationId', ParseIntPipe) reservationId: number,
  ): Promise<GuestResponseDto[]> {
    const guests = await this.guestsService.findByReservation(reservationId);
    return guests.map(toGuestResponse);
  }

  // GET /api/guests/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<GuestResponseDto> {
    const guest = await this.guestsService.findOne(id);
    return toGuestResponse(guest);
  }

  // PATCH /api/guests/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGuestDto,
  ): Promise<GuestResponseDto> {
    const guest = await this.guestsService.update(id, dto);
    return toGuestResponse(guest);
  }

  // DELETE /api/guests/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.guestsService.remove(id);
  }
}