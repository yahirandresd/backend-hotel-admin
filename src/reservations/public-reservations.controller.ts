import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto, toReservationResponse } from './dto/reservation-response.dto';
import { Public } from '../auth/decorators/public.decorator';

// Único acceso sin JWT a este dominio — el cliente llena el formulario desde
// el link que le envió el hotel. El tenant se resuelve internamente a partir
// del `code` (ver ReservationsService.create → ReservationLinksService.validate).
@Public()
@Controller('public/reservations')
export class PublicReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // POST /api/public/reservations/:code
  @Post(':code')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('code') code: string,
    @Body() dto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.create(dto, code);
    return toReservationResponse(reservation);
  }
}
