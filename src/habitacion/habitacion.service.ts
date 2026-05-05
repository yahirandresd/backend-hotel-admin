import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habitacion } from './entities/habitacion.entity';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { TipoHabitacionService } from '../tipo-habitacion/tipo-habitacion.service';

@Injectable()
export class HabitacionService {
  constructor(
    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,
    private readonly tipoHabitacionService: TipoHabitacionService,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreateHabitacionDto): Promise<Habitacion> {
    // Verificar que el tipo existe
    await this.tipoHabitacionService.findOne(dto.tipoId);

    // Verificar que el número de habitación no esté duplicado
    const existe = await this.habitacionRepo.findOne({
      where: { numero: dto.numero },
    });
    if (existe) {
      throw new BadRequestException(`Ya existe una habitación con el número ${dto.numero}`);
    }

    const habitacion = this.habitacionRepo.create(dto);
    return this.habitacionRepo.save(habitacion);
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(): Promise<Habitacion[]> {
    return this.habitacionRepo.find({
      relations: { tipo: true },
      order: { piso: 'ASC', numero: 'ASC' },
    });
  }

  // ── Listar disponibles ────────────────────────────────────────────────────

  async findDisponibles(): Promise<Habitacion[]> {
    return this.habitacionRepo.find({
      where: { estado: 'disponible' },
      relations: { tipo: true },
      order: { piso: 'ASC', numero: 'ASC' },
    });
  }

  // ── Obtener una ───────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Habitacion> {
    const habitacion = await this.habitacionRepo.findOne({
      where: { id },
      relations: { tipo: true },
    });
    if (!habitacion) throw new NotFoundException(`Habitación #${id} no encontrada`);
    return habitacion;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateHabitacionDto): Promise<Habitacion> {
    const habitacion = await this.findOne(id);

    if (dto.tipoId) await this.tipoHabitacionService.findOne(dto.tipoId);

    if (dto.numero && dto.numero !== habitacion.numero) {
      const existe = await this.habitacionRepo.findOne({
        where: { numero: dto.numero },
      });
      if (existe) {
        throw new BadRequestException(`Ya existe una habitación con el número ${dto.numero}`);
      }
    }

    Object.assign(habitacion, dto);
    return this.habitacionRepo.save(habitacion);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const habitacion = await this.findOne(id);
    await this.habitacionRepo.remove(habitacion);
  }
}