import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreatePlanDto, hotelId: number): Promise<Plan> {
    const plan = this.planRepo.create({ ...dto, hotelId });
    return this.planRepo.save(plan);
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(hotelId: number): Promise<Plan[]> {
    return this.planRepo.find({
      where: { hotelId },
      order: { nombre: 'ASC' },
    });
  }

  // ── Listar activos ────────────────────────────────────────────────────────

  async findActivos(hotelId: number): Promise<Plan[]> {
    return this.planRepo.find({
      where: { hotelId, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number, hotelId: number): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id, hotelId } });
    if (!plan) throw new NotFoundException(`Plan #${id} no encontrado`);
    return plan;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdatePlanDto, hotelId: number): Promise<Plan> {
    const plan = await this.findOne(id, hotelId);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number, hotelId: number): Promise<void> {
    const plan = await this.findOne(id, hotelId);

    const enUso = await this.reservationRepo.count({ where: { planId: id, hotelId } });
    if (enUso > 0) {
      throw new ConflictException(
        `No se puede eliminar el plan "${plan.nombre}" — está asignado a ${enUso} reservación(es). Quita el plan de esas reservaciones primero.`,
      );
    }

    await this.planRepo.remove(plan);
  }
}
