import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { PlanActividad } from './entities/plan-actividad.entity';
import { PlanServicio } from './entities/plan-servicio.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(PlanActividad)
    private readonly planActividadRepo: Repository<PlanActividad>,

    @InjectRepository(PlanServicio)
    private readonly planServicioRepo: Repository<PlanServicio>,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreatePlanDto): Promise<Plan> {
    const { actividades: actividadesDto, servicios: serviciosDto, ...planData } = dto;

    const plan = this.planRepo.create(planData);

    plan.actividades = (actividadesDto ?? []).map((a) =>
      this.planActividadRepo.create({ actividadId: a.actividadId, cantidad: a.cantidad ?? 1 }),
    );

    plan.servicios = (serviciosDto ?? []).map((s) =>
      this.planServicioRepo.create({ servicioId: s.servicioId, cantidad: s.cantidad ?? 1 }),
    );

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
    const { actividades: actividadesDto, servicios: serviciosDto, ...planData } = dto;

    Object.assign(plan, planData);

    if (actividadesDto) {
      await this.planActividadRepo.delete({ planId: id });
      plan.actividades = actividadesDto.map((a) =>
        this.planActividadRepo.create({ actividadId: a.actividadId, cantidad: a.cantidad ?? 1 }),
      );
    }

    if (serviciosDto) {
      await this.planServicioRepo.delete({ planId: id });
      plan.servicios = serviciosDto.map((s) =>
        this.planServicioRepo.create({ servicioId: s.servicioId, cantidad: s.cantidad ?? 1 }),
      );
    }

    return this.planRepo.save(plan);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }
}