import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepo.create(dto);
    return this.planRepo.save(plan);
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(): Promise<Plan[]> {
    return this.planRepo.find({
      order: { nombre: 'ASC' },
    });
  }

  // ── Listar activos ────────────────────────────────────────────────────────

  async findActivos(): Promise<Plan[]> {
    return this.planRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan #${id} no encontrado`);
    return plan;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }
}
