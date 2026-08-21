import { Controller, Get, Param } from '@nestjs/common';
import { ReservationLinksService } from './reservation-links.service';
import { LinkResponseDto, toLinkResponse } from './dto/link-response.dto';
import { Public } from '../auth/decorators/public.decorator';

const BASE_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// Único acceso sin JWT a este dominio — separado en su propio controller/prefijo
// (/api/public/links/...) para que la frontera de tenant sea fácil de encontrar
// y para que TenantMiddleware pueda excluirla por ruta exacta (ver app.module.ts).
@Public()
@Controller('public/links')
export class PublicLinksController {
  constructor(private readonly linksService: ReservationLinksService) {}

  // GET /api/public/links/:code
  @Get(':code')
  async validate(@Param('code') code: string): Promise<LinkResponseDto> {
    const link = await this.linksService.validate(code);
    return toLinkResponse(link, BASE_URL);
  }
}
