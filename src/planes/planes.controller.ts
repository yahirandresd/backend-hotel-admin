import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlanesService } from './planes.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanResponseDto, toPlanResponse } from './dto/plan-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'staff')
@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  // POST /api/planes
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlanDto, @Req() req: Request): Promise<PlanResponseDto> {
    const plan = await this.planesService.create(dto, (req as any).user.hotelId);
    return toPlanResponse(plan);
  }

  // GET /api/planes
  @Get()
  async findAll(@Req() req: Request): Promise<PlanResponseDto[]> {
    const planes = await this.planesService.findAll((req as any).user.hotelId);
    return planes.map(toPlanResponse);
  }

  // GET /api/planes/activos
  @Get('activos')
  async findActivos(@Req() req: Request): Promise<PlanResponseDto[]> {
    const planes = await this.planesService.findActivos((req as any).user.hotelId);
    return planes.map(toPlanResponse);
  }

  // GET /api/planes/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<PlanResponseDto> {
    const plan = await this.planesService.findOne(id, (req as any).user.hotelId);
    return toPlanResponse(plan);
  }

  // PATCH /api/planes/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
    @Req() req: Request,
  ): Promise<PlanResponseDto> {
    const plan = await this.planesService.update(id, dto, (req as any).user.hotelId);
    return toPlanResponse(plan);
  }

  // DELETE /api/planes/:id
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
    return this.planesService.remove(id, (req as any).user.hotelId);
  }
}
