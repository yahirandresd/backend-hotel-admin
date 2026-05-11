import {
  Controller, Post, Get, Param,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReservationLinksService } from './reservation-links.service';
import { LinkResponseDto, toLinkResponse } from './dto/link-response.dto';
import { Public } from '../auth/decorators/public.decorator';

const BASE_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

@Controller('reservation-links')
export class ReservationLinksController {
  constructor(private readonly linksService: ReservationLinksService) {}

  // POST /api/reservation-links — solo admin
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(): Promise<LinkResponseDto> {
    const link = await this.linksService.create();
    return toLinkResponse(link, BASE_URL);
  }

  // GET /api/reservation-links — solo admin
  @Get()
  async findAll(): Promise<LinkResponseDto[]> {
    const links = await this.linksService.findAll();
    return links.map((l) => toLinkResponse(l, BASE_URL));
  }

  // GET /api/reservation-links/validate/:code — público
  @Public()
  @Get('validate/:code')
  async validate(@Param('code') code: string): Promise<LinkResponseDto> {
    const link = await this.linksService.validate(code);
    return toLinkResponse(link, BASE_URL);
  }
}