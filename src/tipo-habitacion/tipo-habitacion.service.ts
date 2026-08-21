import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoHabitacion } from './entities/tipo-habitacion.entity';
import { CreateTipoHabitacionDto } from './dto/create-tipo-habitacion.dto';
import { UpdateTipoHabitacionDto } from './dto/update-tipo-habitacion.dto';

@Injectable()
export class TipoHabitacionService {
  constructor(
    @InjectRepository(TipoHabitacion)
    private readonly tipoRepo: Repository<TipoHabitacion>,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreateTipoHabitacionDto, hotelId: number): Promise<TipoHabitacion> {
    const tipo = this.tipoRepo.create({ ...dto, hotelId });
    return this.tipoRepo.save(tipo);
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(hotelId: number): Promise<TipoHabitacion[]> {
    return this.tipoRepo.find({
      where: { hotelId },
      order: { nombre: 'ASC' },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number, hotelId: number): Promise<TipoHabitacion> {
    const tipo = await this.tipoRepo.findOne({ where: { id, hotelId } });
    if (!tipo) throw new NotFoundException(`Tipo de habitación #${id} no encontrado`);
    return tipo;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateTipoHabitacionDto, hotelId: number): Promise<TipoHabitacion> {
    const tipo = await this.findOne(id, hotelId);
    Object.assign(tipo, dto);
    return this.tipoRepo.save(tipo);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number, hotelId: number): Promise<void> {
    const tipo = await this.findOne(id, hotelId);
    await this.tipoRepo.remove(tipo);
  }
}
