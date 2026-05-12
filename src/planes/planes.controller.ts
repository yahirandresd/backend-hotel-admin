import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PlanesService } from './planes.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanResponseDto, toPlanResponse } from './dto/plan-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin')
@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  // POST /api/planes
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlanDto): Promise<PlanResponseDto> {
    const plan = await this.planesService.create(dto);
    return toPlanResponse(plan);
  }

  // GET /api/planes
  @Get()
  async findAll(): Promise<PlanResponseDto[]> {
    const planes = await this.planesService.findAll();
    return planes.map(toPlanResponse);
  }

  // GET /api/planes/activos
  @Get('activos')
  async findActivos(): Promise<PlanResponseDto[]> {
    const planes = await this.planesService.findActivos();
    return planes.map(toPlanResponse);
  }

  // GET /api/planes/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PlanResponseDto> {
    const plan = await this.planesService.findOne(id);
    return toPlanResponse(plan);
  }

  // PATCH /api/planes/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    const plan = await this.planesService.update(id, dto);
    return toPlanResponse(plan);
  }

  // DELETE /api/planes/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.planesService.remove(id);
  }
}