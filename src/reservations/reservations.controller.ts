import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationResponseDto, toReservationResponse } from './dto/reservation-response.dto';

@Public() // 👈 toda la clase es pública
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReservationDto): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.create(dto);
    return toReservationResponse(reservation);
  }

  @Get()
  async findAll(): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationsService.findAll();
    return reservations.map(toReservationResponse);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.findOne(id);
    return toReservationResponse(reservation);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.update(id, dto);
    return toReservationResponse(reservation);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reservationsService.remove(id);
  }
}