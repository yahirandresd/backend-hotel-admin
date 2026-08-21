import {
  Controller, Post, Get, Req,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReservationLinksService } from './reservation-links.service';
import { LinkResponseDto, toLinkResponse } from './dto/link-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

const BASE_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// El endpoint público de validación (sin JWT) vive en public-links.controller.ts.
@Roles('admin', 'staff')
@Controller('reservation-links')
export class ReservationLinksController {
  constructor(private readonly linksService: ReservationLinksService) {}

  // POST /api/reservation-links
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request): Promise<LinkResponseDto> {
    const hotelId = (req as any).user.hotelId;
    const link = await this.linksService.create(hotelId);
    return toLinkResponse(link, BASE_URL);
  }

  // GET /api/reservation-links
  @Get()
  async findAll(@Req() req: Request): Promise<LinkResponseDto[]> {
    const links = await this.linksService.findAll((req as any).user.hotelId);
    return links.map((l) => toLinkResponse(l, BASE_URL));
  }
}
